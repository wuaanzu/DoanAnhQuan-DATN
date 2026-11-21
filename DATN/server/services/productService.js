import { db, inParams, likeParam } from '../config/db.js';
import { config } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { paginated } from '../utils/response.js';
import { deleteUploadByUrl, toPublicUrl } from '../utils/files.js';
import { PRODUCT_STATUS, ROLES } from '../utils/constants.js';
import { notify, notifyAdmins, notifyMany } from './notificationService.js';

/* ------------------------------------------------------------------ */
/* Truy vấn danh sách                                                  */
/* ------------------------------------------------------------------ */

const LIST_SELECT = `
  SELECT p.ProductId, p.Title, p.Price, p.[Condition], p.TransactionType, p.DesiredExchange,
         p.Location, p.Status, p.ModerationNote, p.ViewCount, p.CreatedAt, p.UpdatedAt, p.UserId,
         c.CategoryId, c.CategoryName, c.Icon AS CategoryIcon,
         un.UniversityId, un.UniversityName, un.ShortName AS UniversityShortName,
         u.FullName AS SellerName, u.Avatar AS SellerAvatar,
         (SELECT TOP 1 i.ImageUrl FROM dbo.ProductImages i
           WHERE i.ProductId = p.ProductId ORDER BY i.IsPrimary DESC, i.SortOrder, i.ImageId) AS ImageUrl,
         (SELECT COUNT(*) FROM dbo.Favorites f WHERE f.ProductId = p.ProductId) AS FavoriteCount,
         COUNT(*) OVER() AS TotalCount
    FROM dbo.Products p
    JOIN dbo.Categories   c  ON c.CategoryId   = p.CategoryId
    JOIN dbo.Universities un ON un.UniversityId = p.UniversityId
    JOIN dbo.Users        u  ON u.UserId        = p.UserId`;

const SORT_SQL = {
  newest: 'p.CreatedAt DESC, p.ProductId DESC',
  price_asc: 'p.Price ASC, p.CreatedAt DESC',
  price_desc: 'p.Price DESC, p.CreatedAt DESC',
  popular: 'FavoriteCount DESC, p.ViewCount DESC, p.CreatedAt DESC',
};

/**
 * Tìm kiếm / lọc / sắp xếp / phân trang sản phẩm công khai (chỉ tin đang hiển thị).
 * Mọi điều kiện lọc đều dùng tham số => an toàn SQL Injection.
 */
export async function listProducts(filters, { page, limit, offset }) {
  const where = ['p.IsDeleted = 0', `p.Status = 'Active'`, `u.Status = 'Active'`];
  const params = { offset, limit };

  if (filters.q) {
    where.push(`(p.Title COLLATE Vietnamese_CI_AI LIKE @q ESCAPE '\\'
                 OR p.Description COLLATE Vietnamese_CI_AI LIKE @q ESCAPE '\\')`);
    params.q = likeParam(filters.q);
  }
  if (filters.categoryId) {
    where.push('p.CategoryId = @categoryId');
    params.categoryId = filters.categoryId;
  }
  if (filters.minPrice !== undefined) {
    where.push('p.Price >= @minPrice');
    params.minPrice = filters.minPrice;
  }
  if (filters.maxPrice !== undefined) {
    where.push('p.Price <= @maxPrice');
    params.maxPrice = filters.maxPrice;
  }
  if (filters.conditions?.length) {
    const inC = inParams('cond', filters.conditions);
    where.push(`p.[Condition] IN (${inC.sql})`);
    Object.assign(params, inC.params);
  }
  if (filters.types?.length) {
    const inT = inParams('type', filters.types);
    where.push(`p.TransactionType IN (${inT.sql})`);
    Object.assign(params, inT.params);
  }
  if (filters.universityId) {
    where.push('p.UniversityId = @universityId');
    params.universityId = filters.universityId;
  }
  if (filters.location) {
    where.push(`p.Location COLLATE Vietnamese_CI_AI LIKE @location ESCAPE '\\'`);
    params.location = likeParam(filters.location);
  }
  if (filters.sellerId) {
    where.push('p.UserId = @sellerId');
    params.sellerId = filters.sellerId;
  }
  if (filters.excludeId) {
    where.push('p.ProductId <> @excludeId');
    params.excludeId = filters.excludeId;
  }

  const orderBy = SORT_SQL[filters.sort] || SORT_SQL.newest;
  const rows = await db.rows(
    `${LIST_SELECT}
      WHERE ${where.join(' AND ')}
      ORDER BY ${orderBy}
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
    params,
  );
  return paginated(rows, { page, limit });
}

/** Tin đăng của chính người dùng (mọi trạng thái trừ đã xóa). */
export async function listMine(userId, { status, q }, { page, limit, offset }) {
  const where = ['p.IsDeleted = 0', 'p.UserId = @userId'];
  const params = { userId, offset, limit };
  if (status) {
    where.push('p.Status = @status');
    params.status = status;
  }
  if (q) {
    where.push(`p.Title COLLATE Vietnamese_CI_AI LIKE @q ESCAPE '\\'`);
    params.q = likeParam(q);
  }
  const rows = await db.rows(
    `SELECT x.*,
            (SELECT COUNT(*) FROM dbo.Transactions t WHERE t.ProductId = x.ProductId AND t.Status = 'Pending') AS PendingRequests
       FROM (${LIST_SELECT} WHERE ${where.join(' AND ')}) x
      ORDER BY x.CreatedAt DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
    params,
  );
  return paginated(rows, { page, limit });
}

/** Sản phẩm tương tự: cùng danh mục, ưu tiên cùng trường. */
export async function listSimilar(productId, limit = 4) {
  const base = await db.one('SELECT CategoryId, UniversityId FROM dbo.Products WHERE ProductId = @id', { id: productId });
  if (!base) return [];
  const rows = await db.rows(
    `${LIST_SELECT}
      WHERE p.IsDeleted = 0 AND p.Status = 'Active' AND u.Status = 'Active'
        AND p.CategoryId = @categoryId AND p.ProductId <> @id
      ORDER BY CASE WHEN p.UniversityId = @universityId THEN 0 ELSE 1 END, p.CreatedAt DESC
      OFFSET 0 ROWS FETCH NEXT @limit ROWS ONLY`,
    { id: productId, categoryId: base.categoryId, universityId: base.universityId, limit },
  );
  return rows.map(({ totalCount, ...r }) => r);
}

/* ------------------------------------------------------------------ */
/* Chi tiết                                                            */
/* ------------------------------------------------------------------ */

async function getImages(productId, executor = db) {
  return executor.rows(
    `SELECT ImageId, ImageUrl, IsPrimary, SortOrder FROM dbo.ProductImages
      WHERE ProductId = @id ORDER BY IsPrimary DESC, SortOrder, ImageId`,
    { id: productId },
  );
}

async function getProductRow(productId, executor = db) {
  return executor.one(
    `SELECT p.*, c.CategoryName, c.Icon AS CategoryIcon,
            un.UniversityName, un.ShortName AS UniversityShortName,
            u.FullName AS SellerName, u.Avatar AS SellerAvatar, u.CreatedAt AS SellerJoinedAt,
            u.Status AS SellerStatus, su.UniversityName AS SellerUniversityName,
            (SELECT CAST(AVG(CAST(r.Rating AS DECIMAL(4,2))) AS DECIMAL(3,2)) FROM dbo.Reviews r WHERE r.RevieweeId = u.UserId) AS SellerRating,
            (SELECT COUNT(*) FROM dbo.Reviews r WHERE r.RevieweeId = u.UserId) AS SellerReviewCount,
            (SELECT COUNT(*) FROM dbo.Products sp WHERE sp.UserId = u.UserId AND sp.Status = 'Active' AND sp.IsDeleted = 0) AS SellerActiveCount,
            (SELECT COUNT(*) FROM dbo.Favorites f WHERE f.ProductId = p.ProductId) AS FavoriteCount
       FROM dbo.Products p
       JOIN dbo.Categories   c  ON c.CategoryId   = p.CategoryId
       JOIN dbo.Universities un ON un.UniversityId = p.UniversityId
       JOIN dbo.Users        u  ON u.UserId        = p.UserId
       LEFT JOIN dbo.Universities su ON su.UniversityId = u.UniversityId
      WHERE p.ProductId = @id AND p.IsDeleted = 0`,
    { id: productId },
  );
}

export async function getProductDetail(productId, viewer) {
  const product = await getProductRow(productId);
  if (!product) throw ApiError.notFound('Tin đăng không tồn tại hoặc đã bị xóa');

  const isOwner = viewer?.id === product.userId;
  const isAdmin = viewer?.role === ROLES.ADMIN;
  const publicStatuses = [PRODUCT_STATUS.ACTIVE, PRODUCT_STATUS.COMPLETED];
  if (!publicStatuses.includes(product.status) && !isOwner && !isAdmin) {
    throw ApiError.notFound('Tin đăng không tồn tại hoặc chưa được hiển thị');
  }

  if (!isOwner && product.status === PRODUCT_STATUS.ACTIVE) {
    await db.execute('UPDATE dbo.Products SET ViewCount = ViewCount + 1 WHERE ProductId = @id', { id: productId });
    product.viewCount += 1;
  }

  const images = await getImages(productId);
  let viewerState = { isOwner, isFavorited: false, openRequest: null, pendingRequestCount: 0 };

  if (viewer) {
    const fav = await db.scalar('SELECT 1 FROM dbo.Favorites WHERE UserId = @u AND ProductId = @p', {
      u: viewer.id,
      p: productId,
    });
    const openRequest = isOwner
      ? null
      : await db.one(
          `SELECT TOP 1 TransactionId, Status, TransactionType, CreatedAt FROM dbo.Transactions
            WHERE ProductId = @p AND BuyerId = @u AND Status IN ('Pending', 'Accepted')`,
          { p: productId, u: viewer.id },
        );
    const pendingRequestCount = isOwner
      ? Number(await db.scalar(
          `SELECT COUNT(*) FROM dbo.Transactions WHERE ProductId = @p AND Status = 'Pending'`,
          { p: productId },
        ))
      : 0;
    viewerState = { isOwner, isFavorited: Boolean(fav), openRequest, pendingRequestCount };
  }

  return {
    ...product,
    sellerRating: product.sellerRating !== null ? Number(product.sellerRating) : null,
    images,
    viewer: viewerState,
  };
}

/* ------------------------------------------------------------------ */
/* Tạo / sửa / xóa                                                     */
/* ------------------------------------------------------------------ */

async function assertRefs({ categoryId, universityId }) {
  const errors = [];
  const cat = await db.one('SELECT Status FROM dbo.Categories WHERE CategoryId = @id', { id: categoryId });
  if (!cat || cat.status !== 'Active') errors.push({ field: 'categoryId', message: 'Danh mục không hợp lệ' });
  const uni = await db.scalar('SELECT 1 FROM dbo.Universities WHERE UniversityId = @id', { id: universityId });
  if (!uni) errors.push({ field: 'universityId', message: 'Trường đại học không hợp lệ' });
  if (errors.length) throw ApiError.validation(errors);
}

/** Chuẩn hóa dữ liệu theo hình thức giao dịch: tặng miễn phí => giá 0; chỉ trao đổi mới có DesiredExchange. */
function normalizeProductInput(data) {
  const type = data.transactionType;
  return {
    title: data.title.trim(),
    description: data.description.trim(),
    categoryId: data.categoryId,
    universityId: data.universityId,
    price: type === 'Free' ? 0 : Math.round(Number(data.price) || 0),
    condition: data.condition,
    transactionType: type,
    desiredExchange: type === 'Exchange' ? data.desiredExchange?.trim() || null : null,
    location: data.location.trim(),
  };
}

export async function createProduct(user, data, files = []) {
  if (!files.length) {
    throw ApiError.validation([{ field: 'images', message: 'Vui lòng tải lên ít nhất 1 ảnh sản phẩm' }]);
  }
  await assertRefs(data);
  const input = normalizeProductInput(data);
  const status = config.business.productAutoApprove ? PRODUCT_STATUS.ACTIVE : PRODUCT_STATUS.PENDING;

  const productId = await db.transaction(async (tx) => {
    const id = await tx.scalar(
      `INSERT INTO dbo.Products (UserId, CategoryId, UniversityId, Title, Description, Price, [Condition],
                                 TransactionType, DesiredExchange, Location, Status)
       OUTPUT INSERTED.ProductId
       VALUES (@userId, @categoryId, @universityId, @title, @description, @price, @condition,
               @transactionType, @desiredExchange, @location, @status)`,
      { ...input, userId: user.id, status },
    );
    for (let i = 0; i < files.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await tx.execute(
        `INSERT INTO dbo.ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder) VALUES (@id, @url, @primary, @sort)`,
        { id, url: toPublicUrl(files[i]), primary: i === 0, sort: i },
      );
    }
    return id;
  });

  if (status === PRODUCT_STATUS.PENDING) {
    await notifyAdmins({
      title: 'Tin đăng mới chờ duyệt',
      content: `${user.fullName} vừa đăng "${input.title}".`,
      type: 'Product',
      relatedId: productId,
      link: '/admin/products?status=Pending',
    });
  }
  return getProductDetail(productId, user);
}

async function getOwnedProduct(productId, user, executor = db) {
  const product = await executor.one(
    'SELECT * FROM dbo.Products WITH (UPDLOCK, ROWLOCK) WHERE ProductId = @id AND IsDeleted = 0',
    { id: productId },
  );
  if (!product) throw ApiError.notFound('Tin đăng không tồn tại hoặc đã bị xóa');
  if (product.userId !== user.id) throw ApiError.forbidden('Bạn chỉ có thể chỉnh sửa tin đăng của chính mình');
  return product;
}

/**
 * Cập nhật tin đăng.
 * - Không sửa được tin đã giao dịch xong.
 * - Khi bật kiểm duyệt: tin đang hiển thị / bị từ chối sau khi sửa sẽ quay về "Chờ duyệt".
 */
export async function updateProduct(user, productId, data, files = [], { removeImageIds = [], primaryImageId } = {}) {
  await assertRefs(data);
  const input = normalizeProductInput(data);
  const removedUrls = [];

  const resultStatus = await db.transaction(async (tx) => {
    const product = await getOwnedProduct(productId, user, tx);
    if (product.status === PRODUCT_STATUS.COMPLETED) {
      throw ApiError.badRequest('Tin đăng đã hoàn thành giao dịch, không thể chỉnh sửa');
    }

    const images = await getImages(productId, tx);
    const toRemove = images.filter((img) => removeImageIds.includes(img.imageId));
    const remaining = images.length - toRemove.length + files.length;
    if (remaining < 1) throw ApiError.validation([{ field: 'images', message: 'Tin đăng phải có ít nhất 1 ảnh' }]);
    if (remaining > config.business.maxProductImages) {
      throw ApiError.validation([
        { field: 'images', message: `Mỗi tin đăng tối đa ${config.business.maxProductImages} ảnh` },
      ]);
    }

    let status = product.status;
    if (!config.business.productAutoApprove && [PRODUCT_STATUS.ACTIVE, PRODUCT_STATUS.REJECTED].includes(status)) {
      status = PRODUCT_STATUS.PENDING;
    } else if (config.business.productAutoApprove && status === PRODUCT_STATUS.REJECTED) {
      status = PRODUCT_STATUS.ACTIVE;
    }

    await tx.execute(
      `UPDATE dbo.Products
          SET CategoryId = @categoryId, UniversityId = @universityId, Title = @title, Description = @description,
              Price = @price, [Condition] = @condition, TransactionType = @transactionType,
              DesiredExchange = @desiredExchange, Location = @location, Status = @status,
              ModerationNote = CASE WHEN @status = 'Pending' THEN NULL ELSE ModerationNote END,
              UpdatedAt = SYSUTCDATETIME()
        WHERE ProductId = @id`,
      { ...input, status, id: productId },
    );

    for (const img of toRemove) {
      // eslint-disable-next-line no-await-in-loop
      await tx.execute('DELETE FROM dbo.ProductImages WHERE ImageId = @imageId AND ProductId = @id', {
        imageId: img.imageId,
        id: productId,
      });
      removedUrls.push(img.imageUrl);
    }

    const maxSort = images.reduce((m, i) => Math.max(m, i.sortOrder), -1);
    for (let i = 0; i < files.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await tx.execute(
        'INSERT INTO dbo.ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder) VALUES (@id, @url, 0, @sort)',
        { id: productId, url: toPublicUrl(files[i]), sort: maxSort + 1 + i },
      );
    }

    // Chọn ảnh đại diện: theo yêu cầu nếu hợp lệ, nếu không thì ảnh đầu tiên còn lại
    const after = await tx.rows(
      'SELECT ImageId, IsPrimary FROM dbo.ProductImages WHERE ProductId = @id ORDER BY SortOrder, ImageId',
      { id: productId },
    );
    let primaryId = after.find((i) => i.imageId === primaryImageId)?.imageId;
    if (!primaryId) primaryId = after.find((i) => i.isPrimary)?.imageId ?? after[0].imageId;
    await tx.execute('UPDATE dbo.ProductImages SET IsPrimary = 0 WHERE ProductId = @id AND IsPrimary = 1', { id: productId });
    await tx.execute('UPDATE dbo.ProductImages SET IsPrimary = 1 WHERE ImageId = @primaryId', { primaryId });

    return status;
  });

  await Promise.all(removedUrls.map(deleteUploadByUrl));

  if (resultStatus === PRODUCT_STATUS.PENDING) {
    await notifyAdmins({
      title: 'Tin đăng cập nhật chờ duyệt',
      content: `${user.fullName} vừa cập nhật "${input.title}".`,
      type: 'Product',
      relatedId: productId,
      link: '/admin/products?status=Pending',
    });
  }
  return getProductDetail(productId, user);
}

/**
 * Người đăng ẩn / hiện lại tin.
 * Hiện lại tin: nếu bật kiểm duyệt hoặc tin bị Admin ẩn -> chuyển về "Chờ duyệt".
 */
export async function changeOwnStatus(user, productId, status) {
  const product = await getOwnedProduct(productId, user);
  if (status === PRODUCT_STATUS.HIDDEN) {
    if (![PRODUCT_STATUS.ACTIVE, PRODUCT_STATUS.PENDING].includes(product.status)) {
      throw ApiError.badRequest('Chỉ có thể ẩn tin đang hiển thị hoặc đang chờ duyệt');
    }
    await db.execute(
      `UPDATE dbo.Products SET Status = 'Hidden', ModerationNote = NULL, UpdatedAt = SYSUTCDATETIME() WHERE ProductId = @id`,
      { id: productId },
    );
  } else {
    if (product.status !== PRODUCT_STATUS.HIDDEN) throw ApiError.badRequest('Tin đăng không ở trạng thái ẩn');
    const hiddenByAdmin = Boolean(product.moderationNote);
    const next = config.business.productAutoApprove && !hiddenByAdmin ? PRODUCT_STATUS.ACTIVE : PRODUCT_STATUS.PENDING;
    await db.execute(
      'UPDATE dbo.Products SET Status = @next, UpdatedAt = SYSUTCDATETIME() WHERE ProductId = @id',
      { id: productId, next },
    );
  }
  return getProductDetail(productId, user);
}

/**
 * Xóa tin (xóa mềm) – giữ lại lịch sử giao dịch & đánh giá.
 * Các yêu cầu đang mở liên quan bị hủy và người mua được thông báo.
 */
export async function deleteProduct(user, productId) {
  const notifications = await db.transaction(async (tx) => {
    const product = await tx.one(
      'SELECT ProductId, UserId, Title FROM dbo.Products WITH (UPDLOCK) WHERE ProductId = @id AND IsDeleted = 0',
      { id: productId },
    );
    if (!product) throw ApiError.notFound('Tin đăng không tồn tại hoặc đã bị xóa');
    const isAdmin = user.role === ROLES.ADMIN;
    if (product.userId !== user.id && !isAdmin) throw ApiError.forbidden('Bạn chỉ có thể xóa tin đăng của chính mình');

    const affected = await tx.rows(
      `UPDATE dbo.Transactions
          SET Status = 'Cancelled', SellerNote = N'Tin đăng đã bị xóa', UpdatedAt = SYSUTCDATETIME()
       OUTPUT INSERTED.TransactionId, INSERTED.BuyerId, INSERTED.SellerId, INSERTED.ProductId
        WHERE (ProductId = @id OR ProposedProductId = @id) AND Status IN ('Pending', 'Accepted')`,
      { id: productId },
    );
    await tx.execute(
      `UPDATE dbo.Products SET IsDeleted = 1, DeletedAt = SYSUTCDATETIME(), UpdatedAt = SYSUTCDATETIME()
        WHERE ProductId = @id`,
      { id: productId },
    );

    return affected.map((t) => {
      const target = t.productId === productId ? t.buyerId : t.sellerId;
      return {
        userId: target,
        title: 'Yêu cầu giao dịch đã bị hủy',
        content: `Tin đăng "${product.title}" đã bị xóa nên yêu cầu giao dịch liên quan bị hủy.`,
        type: 'Transaction',
        relatedId: t.transactionId,
        link: '/profile?tab=sent',
      };
    }).concat(
      isAdmin && product.userId !== user.id
        ? [{
            userId: product.userId,
            title: 'Tin đăng đã bị gỡ',
            content: `Quản trị viên đã gỡ tin "${product.title}" do vi phạm quy định.`,
            type: 'Product',
            relatedId: productId,
            link: '/profile?tab=products',
          }]
        : [],
    );
  });
  await notifyMany(notifications);
}

/** Dùng cho moderation: thông báo cho chủ tin. */
export async function notifyOwner(productId, payload) {
  const owner = await db.one('SELECT UserId, Title FROM dbo.Products WHERE ProductId = @id', { id: productId });
  if (owner) await notify({ ...payload(owner.title), userId: owner.userId, relatedId: productId, type: 'Product' });
}
