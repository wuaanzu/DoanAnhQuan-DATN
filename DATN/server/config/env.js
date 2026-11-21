import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT_DIR = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(ROOT_DIR, '.env'), quiet: true });

const bool = (value, fallback = false) => {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

const int = (value, fallback) => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
};

const env = process.env;

export const config = {
  env: env.NODE_ENV || 'development',
  isProduction: env.NODE_ENV === 'production',
  port: int(env.PORT, 5000),
  clientUrls: (env.CLIENT_URL || 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  db: {
    driver: (env.DB_DRIVER || 'tedious').toLowerCase(),
    server: env.DB_SERVER || 'localhost',
    port: env.DB_PORT ? int(env.DB_PORT, 1433) : undefined,
    instance: env.DB_INSTANCE || undefined,
    database: env.DB_NAME || 'UniShareDB',
    user: env.DB_USER || undefined,
    password: env.DB_PASSWORD || undefined,
    encrypt: bool(env.DB_ENCRYPT, false),
    trustServerCertificate: bool(env.DB_TRUST_SERVER_CERTIFICATE, true),
    odbcDriver: env.DB_ODBC_DRIVER || 'ODBC Driver 17 for SQL Server',
    trustedConnection: bool(env.DB_TRUSTED_CONNECTION, true),
  },

  jwt: {
    secret: env.JWT_SECRET || '',
    expiresDays: int(env.JWT_EXPIRES_DAYS, 7),
    cookieName: env.COOKIE_NAME || 'unishare_token',
  },

  business: {
    productAutoApprove: bool(env.PRODUCT_AUTO_APPROVE, false),
    requireUniversityEmail: bool(env.REQUIRE_UNIVERSITY_EMAIL, false),
    maxUploadSizeMb: int(env.MAX_UPLOAD_SIZE_MB, 5),
    maxProductImages: int(env.MAX_PRODUCT_IMAGES, 6),
  },

  reset: {
    expiresMinutes: int(env.RESET_TOKEN_EXPIRES_MINUTES, 30),
    exposeLink: bool(env.EXPOSE_RESET_LINK, false) && env.NODE_ENV !== 'production',
  },

  smtp: {
    host: env.SMTP_HOST || '',
    port: int(env.SMTP_PORT, 587),
    secure: bool(env.SMTP_SECURE, false),
    user: env.SMTP_USER || '',
    password: env.SMTP_PASSWORD || '',
    from: env.SMTP_FROM || 'UniShare <no-reply@unishare.vn>',
  },

  uploadDir: path.join(ROOT_DIR, 'uploads'),
};

/** Kiểm tra cấu hình bắt buộc khi khởi động. */
export function assertConfig() {
  const problems = [];
  if (!config.jwt.secret || config.jwt.secret.length < 32) {
    problems.push('JWT_SECRET phải có ít nhất 32 ký tự (xem .env.example).');
  }
  if (config.isProduction && config.jwt.secret.startsWith('change_me')) {
    problems.push('JWT_SECRET vẫn đang là giá trị mẫu – hãy thay bằng chuỗi ngẫu nhiên.');
  }
  if (!['tedious', 'msnodesqlv8'].includes(config.db.driver)) {
    problems.push(`DB_DRIVER không hợp lệ: "${config.db.driver}" (chỉ nhận tedious | msnodesqlv8).`);
  }
  if (problems.length) {
    const err = new Error(`Cấu hình .env chưa hợp lệ:\n - ${problems.join('\n - ')}`);
    err.code = 'CONFIG_ERROR';
    throw err;
  }
}
