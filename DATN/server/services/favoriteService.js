import { db } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { paginated } from '../utils/response.js';

export async function listFavorites(userId, { page, limit, offset }) {
  const rows = await db.rows(
    `SELECT p.ProductId, p.Title, p.Price, p.[Condition], p.TransactionType, p.Location, p.Status,
            p.ViewCount, p.CreatedAt, p.UserId, f.CreatedAt AS FavoritedAt,
            c.CategoryId, c.CategoryName, un.UniversityId, un.UniversityName, un.ShortName AS UniversityShortName,
            u.FullName AS SellerName, u.Avatar AS SellerAvatar,
            (SELECT TOP 1 i.ImageUrl FROM dbo.ProductImages i
              WHERE i.ProductId = p.ProductId ORDER BY i.IsPrimary DESC, i.SortOrder, i.ImageId) AS ImageUrl,
            (SELECT COUNT(*) FROM dbo.Favorites f2 WHERE f2.ProductId = p.ProductId) AS FavoriteCount,
            COUNT(*) OVER() AS TotalCount
       FROM dbo.Favorites f
       JOIN dbo.Products p ON p.ProductId = f.ProductId
       JOIN dbo.Categories c ON c.CategoryId = p.CategoryId
       JOIN dbo.Universities un ON un.UniversityId = p.UniversityId
       JOIN dbo.Users u ON u.UserId = p.UserId
      WHERE f.UserId = @userId AND p.IsDeleted = 0
      ORDER BY f.CreatedAt DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
    { userId, offset, limit },
  );
  return paginated(rows, { page, limit });
}

export async function listFavoriteIds(userId) {
  const rows = await db.rows(
    `SELECT f.ProductId FROM dbo.Favorites f JOIN dbo.Products p ON p.ProductId = f.ProductId
      WHERE f.UserId = @userId AND p.IsDeleted = 0`,
    { userId },
  );
  return rows.map((r) => r.productId);
}

export async function addFavorite(userId, productId) {
  const product = await db.one(
    'SELECT UserId, Status FROM dbo.Products WHERE ProductId = @id AND IsDeleted = 0',
    { id: productId },
  );
  if (!product || !['Active', 'Completed'].includes(product.status)) {
    throw ApiError.notFound('Tin đăng không tồn tại hoặc chưa được hiển thị');
  }
  if (product.userId === userId) throw ApiError.badRequest('Bạn không thể yêu thích tin đăng của chính mình');
  await db.execute(
    `IF NOT EXISTS (SELECT 1 FROM dbo.Favorites WHERE UserId = @u AND ProductId = @p)
       INSERT INTO dbo.Favorites (UserId, ProductId) VALUES (@u, @p)`,
    { u: userId, p: productId },
  );
  return countFavorites(productId);
}

export async function removeFavorite(userId, productId) {
  await db.execute('DELETE FROM dbo.Favorites WHERE UserId = @u AND ProductId = @p', { u: userId, p: productId });
  return countFavorites(productId);
}

async function countFavorites(productId) {
  return { productId, favoriteCount: Number(await db.scalar('SELECT COUNT(*) FROM dbo.Favorites WHERE ProductId = @p', { p: productId })) };
}
