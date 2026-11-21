import { db, likeParam } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { paginated } from '../utils/response.js';
import { notify, notifyMany } from './notificationService.js';

/* ------------------------------------------------------------------ */
/* Thống kê dashboard                                                 */
/* ------------------------------------------------------------------ */

const pad = (n) => String(n).padStart(2, '0');
// Ngày theo giờ Việt Nam (UTC+7) để khớp với cách SQL nhóm dữ liệu
const vnDate = (d) => new Date(d.getTime() + 7 * 3600 * 1000);

export async function getDashboardStats() {
  const totals = await db.one(
    `SELECT
        (SELECT COUNT(*) FROM dbo.Users WHERE Role = 'Student') AS TotalStudents,
        (SELECT COUNT(*) FROM dbo.Users WHERE Role = 'Student' AND Status = 'Locked') AS LockedStudents,
        (SELECT COUNT(*) FROM dbo.Products WHERE IsDeleted = 0) AS TotalProducts,
        (SELECT COUNT(*) FROM dbo.Products WHERE IsDeleted = 0 AND Status = 'Active') AS ActiveProducts,
        (SELECT COUNT(*) FROM dbo.Products WHERE IsDeleted = 0 AND Status = 'Pending') AS PendingProducts,
        (SELECT COUNT(*) FROM dbo.Transactions WHERE Status = 'Completed') AS CompletedTransactions,
        (SELECT COUNT(*) FROM dbo.Transactions WHERE Status IN ('Pending','Accepted')) AS OpenTransactions,
        (SELECT COUNT(*) FROM dbo.Reports WHERE Status = 'Pending') AS PendingReports`,
  );

  // Tin đăng 30 ngày gần nhất
  const byDayRows = await db.rows(
    `SELECT CONVERT(CHAR(10), CAST(DATEADD(HOUR, 7, CreatedAt) AS DATE), 23) AS Day, COUNT(*) AS Total
       FROM dbo.Products
      WHERE CreatedAt >= DATEADD(DAY, -30, SYSUTCDATETIME())
      GROUP BY CAST(DATEADD(HOUR, 7, CreatedAt) AS DATE)`,
  );
  const dayMap = new Map(byDayRows.map((r) => [r.day, r.total]));
  const productsByDay = [];
  const today = vnDate(new Date());
  for (let i = 29; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i));
    const key = d.toISOString().slice(0, 10);
    productsByDay.push({ date: key, label: `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}`, total: dayMap.get(key) || 0 });
  }

  // Phân loại theo danh mục
  const productsByCategory = await db.rows(
    `SELECT c.CategoryId, c.CategoryName, COUNT(p.ProductId) AS Total
       FROM dbo.Categories c
       LEFT JOIN dbo.Products p ON p.CategoryId = c.CategoryId AND p.IsDeleted = 0
      GROUP BY c.CategoryId, c.CategoryName, c.SortOrder
      ORDER BY c.SortOrder`,
  );

  // Giao dịch theo tháng (12 tháng)
  const byMonthRows = await db.rows(
    `SELECT YEAR(DATEADD(HOUR, 7, CreatedAt)) AS Y, MONTH(DATEADD(HOUR, 7, CreatedAt)) AS M,
            COUNT(*) AS Total,
            SUM(CASE WHEN Status = 'Completed' THEN 1 ELSE 0 END) AS Completed
       FROM dbo.Transactions
      WHERE CreatedAt >= DATEADD(MONTH, -12, SYSUTCDATETIME())
      GROUP BY YEAR(DATEADD(HOUR, 7, CreatedAt)), MONTH(DATEADD(HOUR, 7, CreatedAt))`,
  );
  const monthMap = new Map(byMonthRows.map((r) => [`${r.y}-${r.m}`, r]));
  const transactionsByMonth = [];
  for (let i = 11; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - i, 1));
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`;
    const r = monthMap.get(key);
    transactionsByMonth.push({
      month: key,
      label: `T${d.getUTCMonth() + 1}/${String(d.getUTCFullYear()).slice(2)}`,
      total: r?.total || 0,
      completed: r?.completed || 0,
    });
  }

  const transactionsByType = await db.rows(
    `SELECT TransactionType, COUNT(*) AS Total FROM dbo.Products WHERE IsDeleted = 0 GROUP BY TransactionType`,
  );

  return { totals, productsByDay, productsByCategory, transactionsByMonth, transactionsByType };
}

/* ------------------------------------------------------------------ */
/* Người dùng                                                         */
/* ------------------------------------------------------------------ */

export async function listUsers({ q, role, status, universityId }, { page, limit, offset }) {
  const where = ['1 = 1'];
  const params = { offset, limit };
  if (q) {
    where.push(`(u.FullName COLLATE Vietnamese_CI_AI LIKE @q ESCAPE '\\' OR u.Email LIKE @q ESCAPE '\\' OR u.StudentCode LIKE @q ESCAPE '\\')`);
    params.q = likeParam(q);
  }
  if (role) {
    where.push('u.Role = @role');
    params.role = role;
  }
  if (status) {
    where.push('u.Status = @status');
    params.status = status;
  }
  if (universityId) {
    where.push('u.UniversityId = @universityId');
    params.universityId = universityId;
  }
  const rows = await db.rows(
    `SELECT u.UserId, u.FullName, u.Email, u.StudentCode, u.Avatar, u.Phone, u.Role, u.Status,
            u.CreatedAt, u.LastLoginAt, u.UniversityId, un.UniversityName, un.ShortName AS UniversityShortName,
            (SELECT COUNT(*) FROM dbo.Products p WHERE p.UserId = u.UserId AND p.IsDeleted = 0) AS ProductCount,
            (SELECT COUNT(*) FROM dbo.Reports r WHERE r.ReportedUserId = u.UserId) AS ReportCount,
            COUNT(*) OVER() AS TotalCount
       FROM dbo.Users u
       LEFT JOIN dbo.Universities un ON un.UniversityId = u.UniversityId
      WHERE ${where.join(' AND ')}
      ORDER BY u.CreatedAt DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
    params,
  );
  return paginated(rows, { page, limit });
}

export async function setUserStatus(admin, userId, status) {
  if (userId === admin.id) throw ApiError.badRequest('Bạn không thể tự khóa tài khoản của mình');
  const user = await db.one('SELECT UserId, Role, Status FROM dbo.Users WHERE UserId = @id', { id: userId });
  if (!user) throw ApiError.notFound('Không tìm thấy người dùng');
  if (user.role === 'Admin') throw ApiError.badRequest('Không thể khóa tài khoản quản trị viên');
  // Khi khóa: tăng TokenVersion để đăng xuất mọi phiên đang hoạt động
  await db.execute(
    `UPDATE dbo.Users
        SET Status = @status,
            TokenVersion = CASE WHEN @status = 'Locked' THEN TokenVersion + 1 ELSE TokenVersion END,
            UpdatedAt = SYSUTCDATETIME()
      WHERE UserId = @id`,
    { id: userId, status },
  );
  if (status === 'Active' && user.status === 'Locked') {
    await notify({
      userId,
      title: 'Tài khoản đã được mở khóa',
      content: 'Tài khoản của bạn đã được quản trị viên mở khóa. Vui lòng tuân thủ quy định cộng đồng.',
      type: 'System',
    });
  }
  return db.one('SELECT UserId, FullName, Email, Role, Status FROM dbo.Users WHERE UserId = @id', { id: userId });
}

/* ------------------------------------------------------------------ */
/* Tin đăng                                                           */
/* ------------------------------------------------------------------ */

export async function listAllProducts({ status, q, categoryId }, { page, limit, offset }) {
  const where = ['p.IsDeleted = 0'];
  const params = { offset, limit };
  if (status) {
    where.push('p.Status = @status');
    params.status = status;
  }
  if (categoryId) {
    where.push('p.CategoryId = @categoryId');
    params.categoryId = categoryId;
  }
  if (q) {
    where.push(`(p.Title COLLATE Vietnamese_CI_AI LIKE @q ESCAPE '\\' OR u.FullName COLLATE Vietnamese_CI_AI LIKE @q ESCAPE '\\')`);
    params.q = likeParam(q);
  }
  const rows = await db.rows(
    `SELECT p.ProductId, p.Title, p.Price, p.[Condition], p.TransactionType, p.Status, p.ModerationNote,
            p.ViewCount, p.CreatedAt, p.UpdatedAt, p.Location,
            c.CategoryName, un.ShortName AS UniversityShortName, un.UniversityName,
            u.UserId, u.FullName AS SellerName, u.Email AS SellerEmail,
            (SELECT TOP 1 i.ImageUrl FROM dbo.ProductImages i WHERE i.ProductId = p.ProductId
              ORDER BY i.IsPrimary DESC, i.SortOrder, i.ImageId) AS ImageUrl,
            (SELECT COUNT(*) FROM dbo.Reports r WHERE r.ProductId = p.ProductId AND r.Status = 'Pending') AS PendingReports,
            COUNT(*) OVER() AS TotalCount
       FROM dbo.Products p
       JOIN dbo.Categories c ON c.CategoryId = p.CategoryId
       JOIN dbo.Universities un ON un.UniversityId = p.UniversityId
       JOIN dbo.Users u ON u.UserId = p.UserId
      WHERE ${where.join(' AND ')}
      ORDER BY CASE WHEN p.Status = 'Pending' THEN 0 ELSE 1 END, p.CreatedAt DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
    params,
  );
  return paginated(rows, { page, limit });
}

/** action: approve | reject | hide */
export async function moderateProduct(admin, productId, { action, note }) {
  const product = await db.one(
    'SELECT ProductId, UserId, Title, Status FROM dbo.Products WHERE ProductId = @id AND IsDeleted = 0',
    { id: productId },
  );
  if (!product) throw ApiError.notFound('Tin đăng không tồn tại');

  const rules = {
    approve: { from: ['Pending', 'Hidden', 'Rejected'], to: 'Active' },
    reject: { from: ['Pending'], to: 'Rejected' },
    hide: { from: ['Active', 'Pending'], to: 'Hidden' },
  };
  const rule = rules[action];
  if (!rule.from.includes(product.status)) {
    throw ApiError.badRequest(`Không thể thực hiện thao tác này với tin ở trạng thái "${product.status}"`);
  }
  if (action !== 'approve' && !note?.trim()) {
    throw ApiError.validation([{ field: 'note', message: 'Vui lòng nhập lý do' }]);
  }

  await db.execute(
    `UPDATE dbo.Products SET Status = @to, ModerationNote = @note, UpdatedAt = SYSUTCDATETIME() WHERE ProductId = @id`,
    { id: productId, to: rule.to, note: action === 'approve' ? null : note.trim() },
  );

  const messages = {
    approve: { title: 'Tin đăng đã được duyệt', content: `Tin "${product.title}" đã được duyệt và đang hiển thị.` },
    reject: { title: 'Tin đăng bị từ chối', content: `Tin "${product.title}" bị từ chối. Lý do: ${note}. Bạn có thể chỉnh sửa và gửi lại.` },
    hide: { title: 'Tin đăng bị ẩn', content: `Tin "${product.title}" đã bị ẩn. Lý do: ${note}.` },
  };
  await notifyMany([{
    userId: product.userId,
    ...messages[action],
    type: 'Product',
    relatedId: productId,
    link: action === 'approve' ? `/products/${productId}` : '/profile?tab=products',
  }]);
  return db.one('SELECT ProductId, Title, Status, ModerationNote FROM dbo.Products WHERE ProductId = @id', { id: productId });
}

/* ------------------------------------------------------------------ */
/* Giao dịch                                                          */
/* ------------------------------------------------------------------ */

export async function listAllTransactions({ status, type, q }, { page, limit, offset }) {
  const where = ['1 = 1'];
  const params = { offset, limit };
  if (status) {
    where.push('t.Status = @status');
    params.status = status;
  }
  if (type) {
    where.push('t.TransactionType = @type');
    params.type = type;
  }
  if (q) {
    where.push(`(p.Title COLLATE Vietnamese_CI_AI LIKE @q ESCAPE '\\' OR s.FullName COLLATE Vietnamese_CI_AI LIKE @q ESCAPE '\\' OR b.FullName COLLATE Vietnamese_CI_AI LIKE @q ESCAPE '\\')`);
    params.q = likeParam(q);
  }
  const rows = await db.rows(
    `SELECT t.TransactionId, t.TransactionType, t.Status, t.Message, t.MeetingPlace, t.MeetingTime,
            t.CreatedAt, t.UpdatedAt, t.CompletedAt,
            p.ProductId, p.Title AS ProductTitle, p.Price AS ProductPrice,
            s.UserId AS SellerId, s.FullName AS SellerName,
            b.UserId AS BuyerId, b.FullName AS BuyerName,
            pp.Title AS ProposedProductTitle,
            COUNT(*) OVER() AS TotalCount
       FROM dbo.Transactions t
       JOIN dbo.Products p ON p.ProductId = t.ProductId
       LEFT JOIN dbo.Products pp ON pp.ProductId = t.ProposedProductId
       JOIN dbo.Users s ON s.UserId = t.SellerId
       JOIN dbo.Users b ON b.UserId = t.BuyerId
      WHERE ${where.join(' AND ')}
      ORDER BY t.CreatedAt DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
    params,
  );
  return paginated(rows, { page, limit });
}
