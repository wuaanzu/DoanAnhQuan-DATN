import { db, likeParam } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { paginated } from '../utils/response.js';
import { notifyAdmins, notifyMany } from './notificationService.js';

export async function createReport(user, { productId, reportedUserId, reason, description }) {
  let targetUserId = reportedUserId || null;
  let productTitle = null;

  if (productId) {
    const product = await db.one('SELECT UserId, Title FROM dbo.Products WHERE ProductId = @id AND IsDeleted = 0', {
      id: productId,
    });
    if (!product) throw ApiError.notFound('Tin đăng không tồn tại');
    if (product.userId === user.id) throw ApiError.badRequest('Bạn không thể báo cáo tin đăng của chính mình');
    targetUserId = product.userId; // lưu kèm chủ tin để Admin dễ xử lý
    productTitle = product.title;
  }
  if (!productId && !targetUserId) throw ApiError.validation([{ field: 'productId', message: 'Cần chọn tin đăng hoặc người dùng cần báo cáo' }]);
  if (targetUserId === user.id) throw ApiError.badRequest('Bạn không thể báo cáo chính mình');
  if (!productId) {
    const u = await db.scalar('SELECT 1 FROM dbo.Users WHERE UserId = @id', { id: targetUserId });
    if (!u) throw ApiError.notFound('Người dùng không tồn tại');
  }

  const dup = await db.scalar(
    `SELECT 1 FROM dbo.Reports
      WHERE ReporterId = @r AND Status = 'Pending'
        AND ((@p IS NOT NULL AND ProductId = @p) OR (@p IS NULL AND ProductId IS NULL AND ReportedUserId = @ru))`,
    { r: user.id, p: productId ?? null, ru: targetUserId },
  );
  if (dup) throw ApiError.conflict('Bạn đã gửi báo cáo này và đang chờ quản trị viên xử lý');

  const report = await db.one(
    `INSERT INTO dbo.Reports (ReporterId, ProductId, ReportedUserId, Reason, Description)
     OUTPUT INSERTED.*
     VALUES (@r, @p, @ru, @reason, @description)`,
    { r: user.id, p: productId ?? null, ru: targetUserId, reason: reason.trim(), description: description?.trim() || null },
  );

  await notifyAdmins({
    title: 'Báo cáo vi phạm mới',
    content: `${user.fullName} báo cáo ${productTitle ? `tin "${productTitle}"` : 'một tài khoản'}: ${reason}.`,
    type: 'Report',
    relatedId: report.reportId,
    link: '/admin/reports',
  });
  return report;
}

const REPORT_SELECT = `
  SELECT r.ReportId, r.ReporterId, r.ProductId, r.ReportedUserId, r.Reason, r.Description, r.Status,
         r.AdminNote, r.CreatedAt, r.ResolvedAt,
         rp.FullName AS ReporterName, rp.Email AS ReporterEmail,
         ru.FullName AS ReportedUserName, ru.Status AS ReportedUserStatus,
         p.Title AS ProductTitle, p.Status AS ProductStatus, p.IsDeleted AS ProductDeleted,
         ad.FullName AS ResolvedByName,
         COUNT(*) OVER() AS TotalCount
    FROM dbo.Reports r
    JOIN dbo.Users rp ON rp.UserId = r.ReporterId
    LEFT JOIN dbo.Users ru ON ru.UserId = r.ReportedUserId
    LEFT JOIN dbo.Products p ON p.ProductId = r.ProductId
    LEFT JOIN dbo.Users ad ON ad.UserId = r.ResolvedBy`;

export async function listMyReports(userId, { page, limit, offset }) {
  const rows = await db.rows(
    `${REPORT_SELECT} WHERE r.ReporterId = @u ORDER BY r.CreatedAt DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
    { u: userId, offset, limit },
  );
  const result = paginated(rows, { page, limit });
  result.items = result.items.map(({ reporterEmail, ...rest }) => rest);
  return result;
}

export async function listReports({ status, q }, { page, limit, offset }) {
  const where = ['1 = 1'];
  const params = { offset, limit };
  if (status) {
    where.push('r.Status = @status');
    params.status = status;
  }
  if (q) {
    where.push(`(r.Reason LIKE @q ESCAPE '\\' OR p.Title LIKE @q ESCAPE '\\' OR ru.FullName LIKE @q ESCAPE '\\' OR rp.FullName LIKE @q ESCAPE '\\')`);
    params.q = likeParam(q);
  }
  const rows = await db.rows(
    `${REPORT_SELECT} WHERE ${where.join(' AND ')}
      ORDER BY CASE WHEN r.Status = 'Pending' THEN 0 ELSE 1 END, r.CreatedAt DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
    params,
  );
  return paginated(rows, { page, limit });
}

/**
 * Admin xử lý báo cáo.
 * action: none | hide_product | lock_user (chỉ áp dụng khi status = Resolved)
 */
export async function resolveReport(admin, reportId, { status, adminNote, action = 'none' }) {
  const notifications = await db.transaction(async (tx) => {
    const report = await tx.one(
      `SELECT r.*, p.Title AS ProductTitle, p.UserId AS ProductOwnerId, u.Role AS ReportedRole
         FROM dbo.Reports r WITH (UPDLOCK)
         LEFT JOIN dbo.Products p ON p.ProductId = r.ProductId
         LEFT JOIN dbo.Users u ON u.UserId = r.ReportedUserId
        WHERE r.ReportId = @id`,
      { id: reportId },
    );
    if (!report) throw ApiError.notFound('Không tìm thấy báo cáo');
    if (report.status !== 'Pending') throw ApiError.badRequest('Báo cáo này đã được xử lý');

    const list = [];
    if (status === 'Resolved' && action === 'hide_product') {
      if (!report.productId) throw ApiError.badRequest('Báo cáo không gắn với tin đăng nào');
      await tx.execute(
        `UPDATE dbo.Products SET Status = 'Hidden', ModerationNote = @note, UpdatedAt = SYSUTCDATETIME()
          WHERE ProductId = @id AND IsDeleted = 0`,
        { id: report.productId, note: adminNote?.trim() || 'Vi phạm quy định cộng đồng' },
      );
      list.push({
        userId: report.productOwnerId,
        title: 'Tin đăng bị ẩn do vi phạm',
        content: `Tin "${report.productTitle}" đã bị ẩn. Lý do: ${adminNote || 'Vi phạm quy định cộng đồng'}.`,
        type: 'Product',
        relatedId: report.productId,
        link: '/profile?tab=products',
      });
    }
    if (status === 'Resolved' && action === 'lock_user') {
      if (!report.reportedUserId) throw ApiError.badRequest('Báo cáo không gắn với tài khoản nào');
      if (report.reportedRole === 'Admin') throw ApiError.badRequest('Không thể khóa tài khoản quản trị viên');
      await tx.execute(
        `UPDATE dbo.Users SET Status = 'Locked', TokenVersion = TokenVersion + 1, UpdatedAt = SYSUTCDATETIME()
          WHERE UserId = @id`,
        { id: report.reportedUserId },
      );
    }

    await tx.execute(
      `UPDATE dbo.Reports SET Status = @status, AdminNote = @note, ResolvedBy = @admin, ResolvedAt = SYSUTCDATETIME()
        WHERE ReportId = @id`,
      { id: reportId, status, note: adminNote?.trim() || null, admin: admin.id },
    );
    list.push({
      userId: report.reporterId,
      title: status === 'Resolved' ? 'Báo cáo của bạn đã được xử lý' : 'Báo cáo của bạn đã được xem xét',
      content: status === 'Resolved'
        ? `Cảm ơn bạn! Báo cáo "${report.reason}" đã được xử lý.`
        : `Báo cáo "${report.reason}" không vi phạm quy định.${adminNote ? ` Ghi chú: ${adminNote}` : ''}`,
      type: 'Report',
      relatedId: reportId,
      link: '/profile?tab=reports',
    });
    return list;
  });
  await notifyMany(notifications);
}
