import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

/** Gom lỗi express-validator thành 422 { errors: [{ field, message }] }. */
export function validate(req, _res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const seen = new Set();
  const errors = [];
  for (const e of result.array()) {
    const field = e.path ?? e.param;
    if (seen.has(field)) continue;
    seen.add(field);
    errors.push({ field, message: e.msg });
  }
  throw ApiError.validation(errors, errors[0]?.message || 'Dữ liệu không hợp lệ');
}
