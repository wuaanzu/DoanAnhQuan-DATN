import { rateLimit } from 'express-rate-limit';

const message = (text) => ({ success: false, message: text });

/** Giới hạn chung cho toàn bộ API. */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1500,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: message('Bạn gửi quá nhiều yêu cầu, vui lòng thử lại sau ít phút'),
});

/** Đăng nhập / đăng ký / quên mật khẩu – chống dò mật khẩu (brute force). */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: message('Bạn đã thử quá nhiều lần, vui lòng thử lại sau 15 phút'),
});

/** Các thao tác tạo nội dung (đăng tin, gửi yêu cầu, báo cáo). */
export const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: message('Bạn thao tác quá nhanh, vui lòng chậm lại một chút'),
});

/** Gửi tin nhắn. */
export const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: message('Bạn gửi tin nhắn quá nhanh, vui lòng chậm lại'),
});
