import { db } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';

export async function listUniversities() {
  return db.rows(
    `SELECT UniversityId, UniversityName, ShortName, Address, EmailDomain
       FROM dbo.Universities ORDER BY UniversityName`,
  );
}

export async function listCategories({ includeHidden = false } = {}) {
  return db.rows(
    `SELECT c.CategoryId, c.CategoryName, c.Description, c.Icon, c.SortOrder, c.Status, c.CreatedAt,
            (SELECT COUNT(*) FROM dbo.Products p
              WHERE p.CategoryId = c.CategoryId AND p.Status = 'Active' AND p.IsDeleted = 0) AS ProductCount
       FROM dbo.Categories c
      WHERE (@all = 1 OR c.Status = 'Active')
      ORDER BY c.SortOrder, c.CategoryName`,
    { all: includeHidden ? 1 : 0 },
  );
}

async function assertUniqueName(name, excludeId = null) {
  const exists = await db.scalar(
    'SELECT 1 FROM dbo.Categories WHERE CategoryName = @name AND (@excludeId IS NULL OR CategoryId <> @excludeId)',
    { name, excludeId },
  );
  if (exists) throw ApiError.conflict('Tên danh mục đã tồn tại', [{ field: 'categoryName', message: 'Tên danh mục đã tồn tại' }]);
}

export async function createCategory({ categoryName, description, icon, sortOrder, status }) {
  const name = categoryName.trim();
  await assertUniqueName(name);
  return db.one(
    `INSERT INTO dbo.Categories (CategoryName, Description, Icon, SortOrder, Status)
     OUTPUT INSERTED.*
     VALUES (@name, @description, @icon, @sortOrder, @status)`,
    {
      name,
      description: description?.trim() || null,
      icon: icon?.trim() || 'Package',
      sortOrder: Number.isInteger(sortOrder) ? sortOrder : 0,
      status: status || 'Active',
    },
  );
}

export async function updateCategory(id, { categoryName, description, icon, sortOrder, status }) {
  const current = await db.one('SELECT * FROM dbo.Categories WHERE CategoryId = @id', { id });
  if (!current) throw ApiError.notFound('Không tìm thấy danh mục');
  const name = categoryName?.trim() || current.categoryName;
  await assertUniqueName(name, id);
  return db.one(
    `UPDATE dbo.Categories
        SET CategoryName = @name, Description = @description, Icon = @icon, SortOrder = @sortOrder, Status = @status
     OUTPUT INSERTED.*
      WHERE CategoryId = @id`,
    {
      id,
      name,
      description: description !== undefined ? description?.trim() || null : current.description,
      icon: icon?.trim() || current.icon,
      sortOrder: Number.isInteger(sortOrder) ? sortOrder : current.sortOrder,
      status: status || current.status,
    },
  );
}

/** Chỉ xóa được danh mục chưa có sản phẩm nào; nếu đã có -> gợi ý ẩn danh mục. */
export async function deleteCategory(id) {
  const used = await db.scalar('SELECT COUNT(*) FROM dbo.Products WHERE CategoryId = @id', { id });
  if (Number(used) > 0) {
    throw ApiError.conflict('Danh mục đang có sản phẩm, không thể xóa. Hãy chuyển sang trạng thái "Ẩn".');
  }
  const affected = await db.execute('DELETE FROM dbo.Categories WHERE CategoryId = @id', { id });
  if (!affected) throw ApiError.notFound('Không tìm thấy danh mục');
}
