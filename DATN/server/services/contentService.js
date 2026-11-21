import { db } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';

export async function listContents() {
  return db.rows('SELECT ContentId, Slug, Title, UpdatedAt FROM dbo.SiteContents ORDER BY ContentId');
}

export async function getContent(slug) {
  const row = await db.one(
    `SELECT c.ContentId, c.Slug, c.Title, c.Body, c.UpdatedAt, u.FullName AS UpdatedByName
       FROM dbo.SiteContents c LEFT JOIN dbo.Users u ON u.UserId = c.UpdatedBy
      WHERE c.Slug = @slug`,
    { slug },
  );
  if (!row) throw ApiError.notFound('Không tìm thấy nội dung');
  return row;
}

export async function updateContent(admin, slug, { title, body }) {
  const affected = await db.execute(
    `UPDATE dbo.SiteContents SET Title = @title, Body = @body, UpdatedBy = @admin, UpdatedAt = SYSUTCDATETIME()
      WHERE Slug = @slug`,
    { slug, title: title.trim(), body: body.trim(), admin: admin.id },
  );
  if (!affected) throw ApiError.notFound('Không tìm thấy nội dung');
  return getContent(slug);
}

/** Số liệu công khai hiển thị trên trang chủ. */
export async function getPublicStats() {
  return db.one(
    `SELECT
        (SELECT COUNT(*) FROM dbo.Users WHERE Role = 'Student' AND Status = 'Active') AS Members,
        (SELECT COUNT(*) FROM dbo.Products WHERE IsDeleted = 0 AND Status IN ('Active', 'Completed')) AS Listings,
        (SELECT COUNT(*) FROM dbo.Products WHERE IsDeleted = 0 AND Status = 'Active') AS ActiveListings,
        (SELECT COUNT(*) FROM dbo.Transactions WHERE Status = 'Completed') AS CompletedTransactions,
        (SELECT COUNT(*) FROM dbo.Products WHERE IsDeleted = 0 AND Status = 'Active' AND TransactionType = 'Free') AS FreeItems,
        (SELECT COUNT(*) FROM dbo.Universities) AS Universities`,
  );
}
