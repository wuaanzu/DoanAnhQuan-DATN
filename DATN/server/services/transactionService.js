/**
 * Quy trình giao dịch:
 *  1. Người mua gửi yêu cầu (Pending)            -> thông báo người đăng
 *  2. Người đăng chấp nhận (Accepted) / từ chối   -> thông báo người mua
 *  3. Hai bên thống nhất địa điểm, thời gian      -> cập nhật MeetingPlace/MeetingTime
 *  4. Người đăng xác nhận hoàn thành (Completed)  -> sản phẩm chuyển "Đã giao dịch",
 *     các yêu cầu đang mở khác của sản phẩm tự động bị từ chối
 *  5. Hai bên đánh giá nhau (reviewService)
 * Giao dịch KHÔNG bao giờ tự hoàn thành khi chỉ có một bên gửi yêu cầu.
 */
import { db } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { paginated } from '../utils/response.js';
import { ROLES, TX_STATUS, TYPE_LABELS } from '../utils/constants.js';
import { notifyMany } from './notificationService.js';

const TX_SELECT = `
  SELECT t.TransactionId, t.ProductId, t.SellerId, t.BuyerId, t.TransactionType, t.ProposedProductId,
         t.Message, t.MeetingPlace, t.MeetingTime, t.SellerNote, t.Status,
         t.CreatedAt, t.UpdatedAt, t.RespondedAt, t.CompletedAt,
         p.Title AS ProductTitle, p.Price AS ProductPrice, p.Status AS ProductStatus, p.IsDeleted AS ProductDeleted,
         (SELECT TOP 1 i.ImageUrl FROM dbo.ProductImages i WHERE i.ProductId = p.ProductId
           ORDER BY i.IsPrimary DESC, i.SortOrder, i.ImageId) AS ProductImage,
         pp.Title AS ProposedProductTitle,
         (SELECT TOP 1 i.ImageUrl FROM dbo.ProductImages i WHERE i.ProductId = pp.ProductId
           ORDER BY i.IsPrimary DESC, i.SortOrder, i.ImageId) AS ProposedProductImage,
         s.FullName AS SellerName, s.Avatar AS SellerAvatar,
         b.FullName AS BuyerName, b.Avatar AS BuyerAvatar`;

const TX_FROM = `
    FROM dbo.Transactions t
    JOIN dbo.Products p ON p.ProductId = t.ProductId
    LEFT JOIN dbo.Products pp ON pp.ProductId = t.ProposedProductId
    JOIN dbo.Users s ON s.UserId = t.SellerId
    JOIN dbo.Users b ON b.UserId = t.BuyerId`;

/* ------------------------------------------------------------------ */

export async function createRequest(buyer, { productId, message, proposedProductId }) {
  const result = await db.transaction(async (tx) => {
    const product = await tx.one(
      `SELECT ProductId, UserId, Title, Status, TransactionType FROM dbo.Products WITH (UPDLOCK, ROWLOCK)
        WHERE ProductId = @id AND IsDeleted = 0`,
      { id: productId },
    );
    if (!product) throw ApiError.notFound('Tin đăng không tồn tại hoặc đã bị xóa');
    if (product.userId === buyer.id) {
      throw ApiError.forbidden('Bạn không thể gửi yêu cầu giao dịch với tin đăng của chính mình');
    }
    if (product.status !== 'Active') throw ApiError.badRequest('Tin đăng hiện không nhận yêu cầu giao dịch');

    let proposedId = null;
    if (proposedProductId) {
      if (product.transactionType !== 'Exchange') {
        throw ApiError.badRequest('Chỉ tin đăng trao đổi mới nhận sản phẩm đề nghị đổi');
      }
      const proposed = await tx.one(
        'SELECT ProductId, UserId, Status FROM dbo.Products WHERE ProductId = @id AND IsDeleted = 0',
        { id: proposedProductId },
      );
      if (!proposed || proposed.userId !== buyer.id) {
        throw ApiError.validation([{ field: 'proposedProductId', message: 'Sản phẩm đề nghị đổi phải là tin đăng của bạn' }]);
      }
      if (proposed.status !== 'Active') {
        throw ApiError.validation([{ field: 'proposedProductId', message: 'Sản phẩm đề nghị đổi phải đang hiển thị' }]);
      }
      proposedId = proposed.productId;
    }

    const open = await tx.scalar(
      `SELECT 1 FROM dbo.Transactions WHERE ProductId = @p AND BuyerId = @b AND Status IN ('Pending', 'Accepted')`,
      { p: productId, b: buyer.id },
    );
    if (open) throw ApiError.conflict('Bạn đã gửi yêu cầu cho tin đăng này và đang chờ xử lý');

    const id = await tx.scalar(
      `INSERT INTO dbo.Transactions (ProductId, SellerId, BuyerId, TransactionType, ProposedProductId, Message)
       OUTPUT INSERTED.TransactionId
       VALUES (@p, @s, @b, @type, @proposed, @message)`,
      {
        p: productId,
        s: product.userId,
        b: buyer.id,
        type: product.transactionType,
        proposed: proposedId,
        message: message?.trim() || null,
      },
    );
    return { id, product };
  });

  const titles = { Sell: 'Yêu cầu mua mới', Exchange: 'Đề nghị trao đổi mới', Free: 'Đăng ký nhận đồ mới' };
  await notifyMany([{
    userId: result.product.userId,
    title: titles[result.product.transactionType],
    content: `${buyer.fullName} muốn ${TYPE_LABELS[result.product.transactionType]} "${result.product.title}".`,
    type: 'Transaction',
    relatedId: result.id,
    link: '/profile?tab=received',
  }]);
  return getTransaction(result.id, buyer);
}

/** role: 'buyer' (yêu cầu đã gửi) | 'seller' (yêu cầu nhận được) | 'all' (lịch sử) */
export async function listTransactions(user, { role = 'all', status, type }, { page, limit, offset }) {
  const where = [];
  const params = { u: user.id, offset, limit };
  if (role === 'buyer') where.push('t.BuyerId = @u');
  else if (role === 'seller') where.push('t.SellerId = @u');
  else where.push('(t.BuyerId = @u OR t.SellerId = @u)');
  if (status?.length) {
    where.push(`t.Status IN (${status.map((_, i) => `@st${i}`).join(', ')})`);
    status.forEach((s, i) => { params[`st${i}`] = s; });
  }
  if (type) {
    where.push('t.TransactionType = @type');
    params.type = type;
  }
  const rows = await db.rows(
    `${TX_SELECT},
         CAST(CASE WHEN EXISTS (SELECT 1 FROM dbo.Reviews r WHERE r.TransactionId = t.TransactionId AND r.ReviewerId = @u)
              THEN 1 ELSE 0 END AS BIT) AS HasReviewed,
         COUNT(*) OVER() AS TotalCount
     ${TX_FROM}
     WHERE ${where.join(' AND ')}
     ORDER BY t.UpdatedAt DESC, t.TransactionId DESC
     OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
    params,
  );
  return paginated(rows, { page, limit });
}

export async function getTransaction(id, user, executor = db) {
  const row = await executor.one(
    `${TX_SELECT},
         CAST(CASE WHEN EXISTS (SELECT 1 FROM dbo.Reviews r WHERE r.TransactionId = t.TransactionId AND r.ReviewerId = @u)
              THEN 1 ELSE 0 END AS BIT) AS HasReviewed
     ${TX_FROM}
     WHERE t.TransactionId = @id`,
    { id, u: user.id },
  );
  if (!row) throw ApiError.notFound('Không tìm thấy giao dịch');
  if (row.sellerId !== user.id && row.buyerId !== user.id && user.role !== ROLES.ADMIN) {
    throw ApiError.forbidden('Bạn không tham gia giao dịch này');
  }
  return row;
}

/** Khóa dòng giao dịch trong SQL transaction để tránh xử lý đồng thời. */
async function lockTransaction(tx, id) {
  const t = await tx.one(
    `SELECT t.*, p.Title AS ProductTitle, p.Status AS ProductStatus
       FROM dbo.Transactions t WITH (UPDLOCK, ROWLOCK)
       JOIN dbo.Products p ON p.ProductId = t.ProductId
      WHERE t.TransactionId = @id`,
    { id },
  );
  if (!t) throw ApiError.notFound('Không tìm thấy giao dịch');
  return t;
}

export async function acceptRequest(user, id, { meetingPlace, meetingTime, sellerNote }) {
  const t = await db.transaction(async (tx) => {
    const row = await lockTransaction(tx, id);
    if (row.sellerId !== user.id) throw ApiError.forbidden('Chỉ người đăng tin mới được chấp nhận yêu cầu');
    if (row.status !== TX_STATUS.PENDING) throw ApiError.badRequest('Chỉ có thể chấp nhận yêu cầu đang chờ');
    if (row.productStatus !== 'Active') throw ApiError.badRequest('Tin đăng không còn hiển thị, không thể chấp nhận');
    await tx.execute(
      `UPDATE dbo.Transactions
          SET Status = 'Accepted', MeetingPlace = @place, MeetingTime = @time, SellerNote = @note,
              RespondedAt = SYSUTCDATETIME(), UpdatedAt = SYSUTCDATETIME()
        WHERE TransactionId = @id`,
      { id, place: meetingPlace?.trim() || null, time: meetingTime ? new Date(meetingTime) : null, note: sellerNote?.trim() || null },
    );
    return row;
  });
  await notifyMany([{
    userId: t.buyerId,
    title: 'Yêu cầu đã được chấp nhận',
    content: `${user.fullName} đã chấp nhận yêu cầu cho "${t.productTitle}". Hãy nhắn tin để hẹn thời gian, địa điểm.`,
    type: 'Transaction',
    relatedId: id,
    link: '/profile?tab=sent',
  }]);
  return getTransaction(id, user);
}

export async function rejectRequest(user, id, { sellerNote }) {
  const t = await db.transaction(async (tx) => {
    const row = await lockTransaction(tx, id);
    if (row.sellerId !== user.id) throw ApiError.forbidden('Chỉ người đăng tin mới được từ chối yêu cầu');
    if (row.status !== TX_STATUS.PENDING) throw ApiError.badRequest('Chỉ có thể từ chối yêu cầu đang chờ');
    await tx.execute(
      `UPDATE dbo.Transactions SET Status = 'Rejected', SellerNote = @note,
              RespondedAt = SYSUTCDATETIME(), UpdatedAt = SYSUTCDATETIME()
        WHERE TransactionId = @id`,
      { id, note: sellerNote?.trim() || null },
    );
    return row;
  });
  await notifyMany([{
    userId: t.buyerId,
    title: 'Yêu cầu bị từ chối',
    content: `Yêu cầu cho "${t.productTitle}" đã bị từ chối.${sellerNote ? ` Lý do: ${sellerNote}` : ''}`,
    type: 'Transaction',
    relatedId: id,
    link: '/profile?tab=sent',
  }]);
  return getTransaction(id, user);
}

/** Người mua hủy yêu cầu Pending/Accepted; người đăng hủy yêu cầu đã Accepted. */
export async function cancelRequest(user, id, { reason }) {
  const t = await db.transaction(async (tx) => {
    const row = await lockTransaction(tx, id);
    const isBuyer = row.buyerId === user.id;
    const isSeller = row.sellerId === user.id;
    if (!isBuyer && !isSeller) throw ApiError.forbidden('Bạn không tham gia giao dịch này');
    const allowed = isBuyer ? [TX_STATUS.PENDING, TX_STATUS.ACCEPTED] : [TX_STATUS.ACCEPTED];
    if (!allowed.includes(row.status)) {
      throw ApiError.badRequest(isSeller && row.status === TX_STATUS.PENDING
        ? 'Với yêu cầu đang chờ, hãy dùng chức năng "Từ chối"'
        : 'Không thể hủy giao dịch ở trạng thái hiện tại');
    }
    await tx.execute(
      `UPDATE dbo.Transactions SET Status = 'Cancelled',
              SellerNote = COALESCE(@reason, SellerNote), UpdatedAt = SYSUTCDATETIME()
        WHERE TransactionId = @id`,
      { id, reason: reason?.trim() || null },
    );
    return { ...row, isBuyer };
  });
  await notifyMany([{
    userId: t.isBuyer ? t.sellerId : t.buyerId,
    title: 'Giao dịch đã bị hủy',
    content: `${user.fullName} đã hủy giao dịch "${t.productTitle}".${reason ? ` Lý do: ${reason}` : ''}`,
    type: 'Transaction',
    relatedId: id,
    link: t.isBuyer ? '/profile?tab=received' : '/profile?tab=sent',
  }]);
  return getTransaction(id, user);
}

export async function updateMeeting(user, id, { meetingPlace, meetingTime }) {
  const t = await db.transaction(async (tx) => {
    const row = await lockTransaction(tx, id);
    if (row.buyerId !== user.id && row.sellerId !== user.id) throw ApiError.forbidden('Bạn không tham gia giao dịch này');
    if (row.status !== TX_STATUS.ACCEPTED) throw ApiError.badRequest('Chỉ cập nhật lịch hẹn cho giao dịch đã được chấp nhận');
    await tx.execute(
      `UPDATE dbo.Transactions SET MeetingPlace = @place, MeetingTime = @time, UpdatedAt = SYSUTCDATETIME()
        WHERE TransactionId = @id`,
      { id, place: meetingPlace.trim(), time: meetingTime ? new Date(meetingTime) : null },
    );
    return row;
  });
  const other = t.buyerId === user.id ? t.sellerId : t.buyerId;
  await notifyMany([{
    userId: other,
    title: 'Lịch hẹn giao dịch được cập nhật',
    content: `${user.fullName} đã cập nhật lịch hẹn cho "${t.productTitle}": ${meetingPlace}.`,
    type: 'Transaction',
    relatedId: id,
    link: other === t.sellerId ? '/profile?tab=received' : '/profile?tab=sent',
  }]);
  return getTransaction(id, user);
}

/**
 * Người đăng xác nhận hoàn thành. Thực hiện trong 1 SQL transaction:
 *  - Giao dịch -> Completed
 *  - Sản phẩm (và sản phẩm đề nghị đổi, nếu có) -> Completed
 *  - Các yêu cầu đang mở khác trên các sản phẩm này -> Rejected
 */
export async function completeRequest(user, id) {
  const { row, others } = await db.transaction(async (tx) => {
    const r = await lockTransaction(tx, id);
    if (r.sellerId !== user.id) throw ApiError.forbidden('Chỉ người đăng tin mới được xác nhận hoàn thành');
    if (r.status !== TX_STATUS.ACCEPTED) {
      throw ApiError.badRequest('Chỉ giao dịch đã được chấp nhận mới có thể xác nhận hoàn thành');
    }

    await tx.execute(
      `UPDATE dbo.Transactions SET Status = 'Completed', CompletedAt = SYSUTCDATETIME(), UpdatedAt = SYSUTCDATETIME()
        WHERE TransactionId = @id`,
      { id },
    );
    await tx.execute(
      `UPDATE dbo.Products SET Status = 'Completed', UpdatedAt = SYSUTCDATETIME()
        WHERE ProductId IN (@p, COALESCE(@pp, -1))`,
      { p: r.productId, pp: r.proposedProductId ?? null },
    );
    const rejected = await tx.rows(
      `UPDATE dbo.Transactions
          SET Status = 'Rejected', SellerNote = N'Sản phẩm đã được giao dịch với người khác',
              RespondedAt = SYSUTCDATETIME(), UpdatedAt = SYSUTCDATETIME()
       OUTPUT INSERTED.TransactionId, INSERTED.BuyerId
        WHERE TransactionId <> @id AND Status IN ('Pending', 'Accepted')
          AND (ProductId IN (@p, COALESCE(@pp, -1)) OR ProposedProductId IN (@p, COALESCE(@pp, -1)))`,
      { id, p: r.productId, pp: r.proposedProductId ?? null },
    );
    return { row: r, others: rejected };
  });

  await notifyMany([
    {
      userId: row.buyerId,
      title: 'Giao dịch hoàn tất 🎉',
      content: `Giao dịch "${row.productTitle}" đã hoàn tất. Hãy để lại đánh giá cho ${user.fullName} nhé!`,
      type: 'Transaction',
      relatedId: id,
      link: '/profile?tab=history',
    },
    ...others.filter((o) => o.buyerId !== row.buyerId).map((o) => ({
      userId: o.buyerId,
      title: 'Yêu cầu bị từ chối',
      content: `"${row.productTitle}" đã được giao dịch với người khác.`,
      type: 'Transaction',
      relatedId: o.transactionId,
      link: '/profile?tab=sent',
    })),
  ]);
  return getTransaction(id, user);
}
