import multer from 'multer';
import { config } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { cleanupRequestFiles } from '../utils/files.js';

export function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`Không tìm thấy API: ${req.method} ${req.originalUrl}`));
}

/** Xử lý lỗi tập trung – luôn trả JSON { success:false, message, errors? }. */
// eslint-disable-next-line no-unused-vars
export async function errorHandler(err, req, res, _next) {
  // Dọn file đã upload nếu request thất bại
  await cleanupRequestFiles(req);

  let status = 500;
  let message = 'Đã xảy ra lỗi máy chủ, vui lòng thử lại sau';
  let errors;

  if (err instanceof ApiError) {
    status = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err instanceof multer.MulterError) {
    status = 400;
    const map = {
      LIMIT_FILE_SIZE: `Mỗi ảnh tối đa ${config.business.maxUploadSizeMb}MB`,
      LIMIT_FILE_COUNT: `Tối đa ${config.business.maxProductImages} ảnh`,
      LIMIT_UNEXPECTED_FILE: 'Trường file tải lên không hợp lệ hoặc vượt quá số lượng cho phép',
    };
    message = map[err.code] || 'Tải file thất bại';
  } else if (err?.type === 'entity.parse.failed') {
    status = 400;
    message = 'Dữ liệu JSON không hợp lệ';
  } else if (err?.type === 'entity.too.large') {
    status = 413;
    message = 'Dữ liệu gửi lên quá lớn';
  } else if (err?.number === 2627 || err?.number === 2601) {
    // Vi phạm UNIQUE constraint / unique index của SQL Server
    status = 409;
    message = 'Dữ liệu đã tồn tại';
  } else if (err?.number === 547) {
    // Vi phạm FOREIGN KEY / CHECK constraint
    status = 409;
    message = 'Thao tác vi phạm ràng buộc dữ liệu';
  } else if (err?.code === 'ESOCKET' || err?.code === 'ELOGIN' || err?.code === 'ETIMEOUT' || err?.code === 'ECONNCLOSED') {
    status = 503;
    message = 'Không kết nối được cơ sở dữ liệu';
  }

  if (status >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl}`, err);
  }

  const body = { success: false, message };
  if (errors) body.errors = errors;
  if (!config.isProduction && status >= 500 && err?.message) body.detail = err.message;
  res.status(status).json(body);
}
