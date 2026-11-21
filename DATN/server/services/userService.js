import { db } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { deleteUploadByUrl } from '../utils/files.js';
import { getAccount } from './authService.js';

/** Hồ sơ công khai – KHÔNG chứa email, số điện thoại, mã sinh viên. */
export async function getPublicProfile(userId) {
  const user = await db.one(
    `SELECT u.UserId, u.FullName, u.Avatar, u.Bio, u.Location, u.Role, u.Status, u.CreatedAt,
            u.UniversityId, un.UniversityName, un.ShortName AS UniversityShortName,
            (SELECT COUNT(*) FROM dbo.Products p WHERE p.UserId = u.UserId AND p.Status = 'Active' AND p.IsDeleted = 0) AS ActiveProducts,
            (SELECT COUNT(*) FROM dbo.Transactions t WHERE (t.SellerId = u.UserId OR t.BuyerId = u.UserId) AND t.Status = 'Completed') AS CompletedTransactions,
            (SELECT CAST(AVG(CAST(r.Rating AS DECIMAL(4,2))) AS DECIMAL(3,2)) FROM dbo.Reviews r WHERE r.RevieweeId = u.UserId) AS RatingAvg,
            (SELECT COUNT(*) FROM dbo.Reviews r WHERE r.RevieweeId = u.UserId) AS RatingCount
       FROM dbo.Users u
       LEFT JOIN dbo.Universities un ON un.UniversityId = u.UniversityId
      WHERE u.UserId = @userId`,
    { userId },
  );
  if (!user) throw ApiError.notFound('Không tìm thấy người dùng');
  return { ...user, ratingAvg: user.ratingAvg !== null ? Number(user.ratingAvg) : null };
}

export async function updateProfile(userId, { fullName, phone, universityId, location, bio }) {
  if (universityId) {
    const exists = await db.scalar('SELECT 1 FROM dbo.Universities WHERE UniversityId = @id', { id: universityId });
    if (!exists) throw ApiError.validation([{ field: 'universityId', message: 'Trường đại học không tồn tại' }]);
  }
  await db.execute(
    `UPDATE dbo.Users
        SET FullName = @fullName,
            Phone = @phone,
            UniversityId = COALESCE(@universityId, UniversityId),
            Location = @location,
            Bio = @bio,
            UpdatedAt = SYSUTCDATETIME()
      WHERE UserId = @userId`,
    {
      userId,
      fullName: fullName.trim(),
      phone: phone?.trim() || null,
      universityId: universityId || null,
      location: location?.trim() || null,
      bio: bio?.trim() || null,
    },
  );
  return getAccount(userId);
}

export async function updateAvatar(userId, avatarUrl) {
  const old = await db.scalar('SELECT Avatar FROM dbo.Users WHERE UserId = @userId', { userId });
  await db.execute('UPDATE dbo.Users SET Avatar = @avatar, UpdatedAt = SYSUTCDATETIME() WHERE UserId = @userId', {
    userId,
    avatar: avatarUrl,
  });
  if (old && old !== avatarUrl) await deleteUploadByUrl(old);
  return getAccount(userId);
}

/** Số liệu tổng quan cho trang quản lý cá nhân. */
export async function getMySummary(userId) {
  const row = await db.one(
    `SELECT
        (SELECT COUNT(*) FROM dbo.Products WHERE UserId = @u AND IsDeleted = 0) AS TotalProducts,
        (SELECT COUNT(*) FROM dbo.Products WHERE UserId = @u AND IsDeleted = 0 AND Status = 'Active') AS ActiveProducts,
        (SELECT COUNT(*) FROM dbo.Products WHERE UserId = @u AND IsDeleted = 0 AND Status = 'Pending') AS PendingProducts,
        (SELECT COUNT(*) FROM dbo.Products WHERE UserId = @u AND IsDeleted = 0 AND Status = 'Completed') AS CompletedProducts,
        (SELECT COUNT(*) FROM dbo.Favorites f JOIN dbo.Products p ON p.ProductId = f.ProductId
          WHERE f.UserId = @u AND p.IsDeleted = 0) AS Favorites,
        (SELECT COUNT(*) FROM dbo.Transactions WHERE BuyerId = @u AND Status IN ('Pending','Accepted')) AS OpenSentRequests,
        (SELECT COUNT(*) FROM dbo.Transactions WHERE SellerId = @u AND Status = 'Pending') AS PendingReceivedRequests,
        (SELECT COUNT(*) FROM dbo.Transactions WHERE (SellerId = @u OR BuyerId = @u) AND Status = 'Completed') AS CompletedTransactions,
        (SELECT CAST(AVG(CAST(Rating AS DECIMAL(4,2))) AS DECIMAL(3,2)) FROM dbo.Reviews WHERE RevieweeId = @u) AS RatingAvg,
        (SELECT COUNT(*) FROM dbo.Reviews WHERE RevieweeId = @u) AS RatingCount`,
    { u: userId },
  );
  return { ...row, ratingAvg: row.ratingAvg !== null ? Number(row.ratingAvg) : null };
}
