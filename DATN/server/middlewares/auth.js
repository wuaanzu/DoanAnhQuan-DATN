import { config } from '../config/env.js';
import { db } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { verifyToken } from '../utils/jwt.js';
import { USER_STATUS } from '../utils/constants.js';

/**
 * Giải mã JWT trong cookie và nạp người dùng hiện tại từ database.
 * Luôn đọc lại từ DB để: phát hiện tài khoản bị khóa, vai trò thay đổi, hoặc token cũ
 * sau khi đổi mật khẩu (TokenVersion).
 */
async function resolveUser(req) {
  let token = req.cookies?.[config.jwt.cookieName];
  if (!token && req.headers?.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.slice(7).trim();
  }
  if (!token) return { user: null, reason: 'NO_TOKEN' };

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return { user: null, reason: 'INVALID_TOKEN' };
  }

  const user = await db.one(
    `SELECT UserId, FullName, Email, Role, Status, TokenVersion, Avatar, UniversityId
       FROM dbo.Users WHERE UserId = @id`,
    { id: Number(payload.sub) },
  );
  if (!user || user.tokenVersion !== payload.tv) return { user: null, reason: 'INVALID_TOKEN' };
  if (user.status === USER_STATUS.LOCKED) return { user: null, reason: 'LOCKED' };

  return {
    user: {
      id: user.userId,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      universityId: user.universityId,
    },
  };
}

/** Bắt buộc đăng nhập. */
export async function authenticate(req, _res, next) {
  const { user, reason } = await resolveUser(req);
  if (!user) {
    if (reason === 'LOCKED') throw ApiError.forbidden('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.');
    throw ApiError.unauthorized(
      reason === 'INVALID_TOKEN' ? 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại' : undefined,
    );
  }
  req.user = user;
  next();
}

/** Không bắt buộc đăng nhập – nếu có cookie hợp lệ thì gắn req.user. */
export async function optionalAuth(req, _res, next) {
  const { user } = await resolveUser(req);
  req.user = user || null;
  next();
}

/** Phân quyền theo vai trò – dùng sau authenticate. */
export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    throw ApiError.forbidden('Chỉ quản trị viên mới được truy cập chức năng này');
  }
  next();
};
