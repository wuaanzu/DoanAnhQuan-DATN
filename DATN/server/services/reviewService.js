import { db } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { paginated } from '../utils/response.js';
import { notify } from './notificationService.js';

/** Chỉ người tham gia giao dịch ĐÃ HOÀN THÀNH mới được đánh giá, mỗi người 1 lần. */
export async function createReview(user, { transactionId, rating, comment }) {
  const t = await db.one(
    `SELECT t.TransactionId, t.SellerId, t.BuyerId, t.Status, p.Title
       FROM dbo.Transactions t JOIN dbo.Products p ON p.ProductId = t.ProductId
      WHERE t.TransactionId = @id`,
    { id: transactionId },
  );
  if (!t) throw ApiError.notFound('Không tìm thấy giao dịch');
  if (t.sellerId !== user.id && t.buyerId !== user.id) {
    throw ApiError.forbidden('Chỉ người tham gia giao dịch mới được đánh giá');
  }
  if (t.status !== 'Completed') throw ApiError.badRequest('Chỉ có thể đánh giá sau khi giao dịch hoàn thành');

  const revieweeId = t.sellerId === user.id ? t.buyerId : t.sellerId;
  const existed = await db.scalar('SELECT 1 FROM dbo.Reviews WHERE TransactionId = @t AND ReviewerId = @u', {
    t: transactionId,
    u: user.id,
  });
  if (existed) throw ApiError.conflict('Bạn đã đánh giá giao dịch này rồi');

  const review = await db.one(
    `INSERT INTO dbo.Reviews (TransactionId, ReviewerId, RevieweeId, Rating, Comment)
     OUTPUT INSERTED.*
     VALUES (@t, @reviewer, @reviewee, @rating, @comment)`,
    { t: transactionId, reviewer: user.id, reviewee: revieweeId, rating, comment: comment?.trim() || null },
  );

  await notify({
    userId: revieweeId,
    title: 'Bạn nhận được đánh giá mới',
    content: `${user.fullName} đã đánh giá bạn ${rating} sao cho giao dịch "${t.title}".`,
    type: 'Review',
    relatedId: review.reviewId,
    link: '/profile?tab=reviews',
  });
  return review;
}

/** Đánh giá mà một người dùng NHẬN ĐƯỢC + thống kê. */
export async function listUserReviews(userId, { page, limit, offset }) {
  const rows = await db.rows(
    `SELECT r.ReviewId, r.TransactionId, r.Rating, r.Comment, r.CreatedAt,
            r.ReviewerId, u.FullName AS ReviewerName, u.Avatar AS ReviewerAvatar,
            p.ProductId, p.Title AS ProductTitle,
            COUNT(*) OVER() AS TotalCount
       FROM dbo.Reviews r
       JOIN dbo.Users u ON u.UserId = r.ReviewerId
       JOIN dbo.Transactions t ON t.TransactionId = r.TransactionId
       JOIN dbo.Products p ON p.ProductId = t.ProductId
      WHERE r.RevieweeId = @userId
      ORDER BY r.CreatedAt DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
    { userId, offset, limit },
  );
  const stats = await db.rows(
    'SELECT Rating, COUNT(*) AS Total FROM dbo.Reviews WHERE RevieweeId = @userId GROUP BY Rating',
    { userId },
  );
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  let count = 0;
  stats.forEach((s) => {
    distribution[s.rating] = s.total;
    sum += s.rating * s.total;
    count += s.total;
  });
  const result = paginated(rows, { page, limit });
  return {
    ...result,
    summary: { average: count ? Math.round((sum / count) * 10) / 10 : null, count, distribution },
  };
}

/** Đánh giá mà người dùng hiện tại ĐÃ VIẾT. */
export async function listGivenReviews(userId, { page, limit, offset }) {
  const rows = await db.rows(
    `SELECT r.ReviewId, r.TransactionId, r.Rating, r.Comment, r.CreatedAt,
            r.RevieweeId, u.FullName AS RevieweeName, u.Avatar AS RevieweeAvatar,
            p.ProductId, p.Title AS ProductTitle,
            COUNT(*) OVER() AS TotalCount
       FROM dbo.Reviews r
       JOIN dbo.Users u ON u.UserId = r.RevieweeId
       JOIN dbo.Transactions t ON t.TransactionId = r.TransactionId
       JOIN dbo.Products p ON p.ProductId = t.ProductId
      WHERE r.ReviewerId = @userId
      ORDER BY r.CreatedAt DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
    { userId, offset, limit },
  );
  return paginated(rows, { page, limit });
}
