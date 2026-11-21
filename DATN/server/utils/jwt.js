import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

/**
 * JWT được lưu trong cookie HttpOnly (JavaScript phía trình duyệt không đọc được)
 * => giảm rủi ro bị đánh cắp token qua XSS so với localStorage.
 * SameSite=Lax chặn cookie trong các request POST/PUT/DELETE xuất phát từ site khác (CSRF).
 */
export function signToken(user) {
  return jwt.sign(
    { sub: String(user.userId), role: user.role, tv: user.tokenVersion ?? 0 },
    config.jwt.secret,
    { expiresIn: `${config.jwt.expiresDays}d` },
  );
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwt.secret);
}

const cookieOptions = () => ({
  httpOnly: true,
  secure: config.isProduction,
  sameSite: 'lax',
  path: '/',
});

export function setAuthCookie(res, user) {
  const token = signToken(user);
  res.cookie(config.jwt.cookieName, token, {
    ...cookieOptions(),
    maxAge: config.jwt.expiresDays * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(config.jwt.cookieName, cookieOptions());
}

/** Đọc token từ chuỗi header Cookie (dùng cho Socket.IO handshake). */
export function readTokenFromCookieHeader(cookieHeader = '') {
  const name = `${config.jwt.cookieName}=`;
  const part = cookieHeader
    .split(';')
    .map((s) => s.trim())
    .find((s) => s.startsWith(name));
  return part ? decodeURIComponent(part.slice(name.length)) : null;
}
