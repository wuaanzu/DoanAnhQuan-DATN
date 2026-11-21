/**
 * Định dạng JSON thống nhất cho mọi response:
 *   Thành công: { success: true,  message, data, meta? }
 *   Thất bại  : { success: false, message, errors? }
 */
export function ok(res, data = null, message = 'Thành công', meta = undefined, status = 200) {
  const body = { success: true, message, data };
  if (meta) body.meta = meta;
  return res.status(status).json(body);
}

export function created(res, data = null, message = 'Tạo mới thành công') {
  return ok(res, data, message, undefined, 201);
}

/** Tách TotalCount (từ COUNT(*) OVER()) khỏi danh sách và tạo meta phân trang. */
export function paginated(rows, { page, limit }) {
  const total = rows.length ? Number(rows[0].totalCount) : 0;
  const items = rows.map(({ totalCount, ...rest }) => rest);
  return {
    items,
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}
