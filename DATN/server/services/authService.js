import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { db } from '../config/db.js';
import { config } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { sendMail, isMailConfigured } from '../utils/mailer.js';
import { USER_STATUS } from '../utils/constants.js';

const SALT_ROUNDS = 10;

/** Thông tin tài khoản của CHÍNH người dùng (không bao giờ chứa PasswordHash). */
export async function getAccount(userId) {
  const user = await db.one(
    `SELECT u.UserId, u.FullName, u.StudentCode, u.Email, u.Avatar, u.UniversityId,
            un.UniversityName, un.ShortName AS UniversityShortName,
            u.Phone, u.Location, u.Bio, u.Role, u.Status, u.IsEmailVerified,
            u.TokenVersion, u.CreatedAt, u.LastLoginAt
       FROM dbo.Users u
       LEFT JOIN dbo.Universities un ON un.UniversityId = u.UniversityId
      WHERE u.UserId = @userId`,
    { userId },
  );
  if (!user) throw ApiError.notFound('Không tìm thấy tài khoản');
  return user;
}

/** Bỏ các trường nội bộ trước khi trả về client. */
export function toAccountDto(user) {
  const { tokenVersion, ...rest } = user;
  return rest;
}

export async function register({ fullName, email, studentCode, universityId, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedCode = studentCode.trim().toUpperCase();

  const university = await db.one(
    'SELECT UniversityId, EmailDomain FROM dbo.Universities WHERE UniversityId = @id',
    { id: universityId },
  );
  if (!university) throw ApiError.validation([{ field: 'universityId', message: 'Trường đại học không tồn tại' }]);

  if (config.business.requireUniversityEmail && university.emailDomain) {
    const domain = normalizedEmail.split('@')[1] || '';
    const allowed = university.emailDomain.toLowerCase();
    if (domain !== allowed && !domain.endsWith(`.${allowed}`)) {
      throw ApiError.validation([
        { field: 'email', message: `Vui lòng dùng email sinh viên có đuôi @${allowed}` },
      ]);
    }
  }

  const dup = await db.rows(
    'SELECT Email, StudentCode FROM dbo.Users WHERE Email = @email OR StudentCode = @code',
    { email: normalizedEmail, code: normalizedCode },
  );
  if (dup.length) {
    const errors = [];
    if (dup.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      errors.push({ field: 'email', message: 'Email này đã được đăng ký' });
    }
    if (dup.some((u) => u.studentCode.toUpperCase() === normalizedCode)) {
      errors.push({ field: 'studentCode', message: 'Mã sinh viên này đã được đăng ký' });
    }
    throw ApiError.conflict(errors[0].message, errors);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const userId = await db.scalar(
    `INSERT INTO dbo.Users (FullName, StudentCode, Email, PasswordHash, UniversityId, Role, Status, LastLoginAt)
     OUTPUT INSERTED.UserId
     VALUES (@fullName, @code, @email, @hash, @universityId, 'Student', 'Active', SYSUTCDATETIME())`,
    { fullName: fullName.trim(), code: normalizedCode, email: normalizedEmail, hash: passwordHash, universityId },
  );
  return getAccount(userId);
}

export async function login({ email, password }) {
  const row = await db.one(
    'SELECT UserId, PasswordHash, Status FROM dbo.Users WHERE Email = @email',
    { email: email.trim().toLowerCase() },
  );
  // So sánh hash kể cả khi không có user để tránh lộ thông tin qua thời gian phản hồi
  const hash = row?.passwordHash || '$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva';
  const valid = await bcrypt.compare(password, hash);
  if (!row || !valid) throw ApiError.unauthorized('Email hoặc mật khẩu không đúng');
  if (row.status === USER_STATUS.LOCKED) {
    throw ApiError.forbidden('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.');
  }
  await db.execute('UPDATE dbo.Users SET LastLoginAt = SYSUTCDATETIME() WHERE UserId = @id', { id: row.userId });
  return getAccount(row.userId);
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  const row = await db.one('SELECT PasswordHash FROM dbo.Users WHERE UserId = @userId', { userId });
  if (!row) throw ApiError.notFound('Không tìm thấy tài khoản');
  if (!(await bcrypt.compare(currentPassword, row.passwordHash))) {
    throw ApiError.validation([{ field: 'currentPassword', message: 'Mật khẩu hiện tại không đúng' }]);
  }
  if (await bcrypt.compare(newPassword, row.passwordHash)) {
    throw ApiError.validation([{ field: 'newPassword', message: 'Mật khẩu mới phải khác mật khẩu hiện tại' }]);
  }
  const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  // Tăng TokenVersion => mọi phiên đăng nhập cũ (thiết bị khác) bị vô hiệu
  await db.execute(
    `UPDATE dbo.Users SET PasswordHash = @hash, TokenVersion = TokenVersion + 1, UpdatedAt = SYSUTCDATETIME()
      WHERE UserId = @userId`,
    { hash, userId },
  );
  return getAccount(userId);
}

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

/**
 * Tạo link đặt lại mật khẩu. Luôn trả về thành công (không tiết lộ email có tồn tại hay không).
 * @returns {{ resetUrl?: string }} resetUrl chỉ trả về ở môi trường dev khi chưa cấu hình SMTP
 */
export async function forgotPassword(email) {
  const user = await db.one(
    `SELECT UserId, FullName, Email FROM dbo.Users WHERE Email = @email AND Status = 'Active'`,
    { email: email.trim().toLowerCase() },
  );
  if (!user) return {};

  const token = crypto.randomBytes(32).toString('hex');
  await db.transaction(async (tx) => {
    await tx.execute(
      `UPDATE dbo.PasswordResetTokens SET UsedAt = SYSUTCDATETIME() WHERE UserId = @userId AND UsedAt IS NULL`,
      { userId: user.userId },
    );
    await tx.execute(
      `INSERT INTO dbo.PasswordResetTokens (UserId, TokenHash, ExpiresAt)
       VALUES (@userId, @hash, DATEADD(MINUTE, @minutes, SYSUTCDATETIME()))`,
      { userId: user.userId, hash: sha256(token), minutes: config.reset.expiresMinutes },
    );
  });

  const resetUrl = `${config.clientUrls[0]}/reset-password?token=${token}`;
  await sendMail({
    to: user.email,
    subject: '[UniShare] Đặt lại mật khẩu',
    text: `Xin chào ${user.fullName},\n\nNhấn vào liên kết sau để đặt lại mật khẩu (hiệu lực ${config.reset.expiresMinutes} phút):\n${resetUrl}\n\nNếu bạn không yêu cầu, hãy bỏ qua email này.`,
    html: `<p>Xin chào <b>${user.fullName}</b>,</p><p>Nhấn vào liên kết sau để đặt lại mật khẩu (hiệu lực ${config.reset.expiresMinutes} phút):</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>`,
  });

  return config.reset.exposeLink && !isMailConfigured() ? { resetUrl } : {};
}

export async function resetPassword({ token, password }) {
  const row = await db.one(
    `SELECT TokenId, UserId FROM dbo.PasswordResetTokens
      WHERE TokenHash = @hash AND UsedAt IS NULL AND ExpiresAt > SYSUTCDATETIME()`,
    { hash: sha256(token) },
  );
  if (!row) throw ApiError.badRequest('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn');

  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  await db.transaction(async (tx) => {
    await tx.execute(
      `UPDATE dbo.Users SET PasswordHash = @hash, TokenVersion = TokenVersion + 1, UpdatedAt = SYSUTCDATETIME()
        WHERE UserId = @userId`,
      { hash, userId: row.userId },
    );
    await tx.execute('UPDATE dbo.PasswordResetTokens SET UsedAt = SYSUTCDATETIME() WHERE TokenId = @id', {
      id: row.tokenId,
    });
  });
}

export const hashPassword = (password) => bcrypt.hash(password, SALT_ROUNDS);
