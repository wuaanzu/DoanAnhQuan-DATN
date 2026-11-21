import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import { config } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { cleanupRequestFiles } from '../utils/files.js';

const MIME_EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

function makeStorage(subDir) {
  const dir = path.join(config.uploadDir, subDir);
  fs.mkdirSync(dir, { recursive: true });
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    // Không dùng tên file gốc của người dùng -> tránh path traversal / ghi đè file
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${crypto.randomUUID()}${MIME_EXT[file.mimetype]}`),
  });
}

function fileFilter(_req, file, cb) {
  if (!MIME_EXT[file.mimetype]) {
    return cb(ApiError.badRequest('Chỉ chấp nhận ảnh định dạng JPG, PNG hoặc WEBP'));
  }
  return cb(null, true);
}

const limits = (files) => ({ fileSize: config.business.maxUploadSizeMb * 1024 * 1024, files });

const productUpload = multer({
  storage: makeStorage('products'),
  fileFilter,
  limits: limits(config.business.maxProductImages),
});

const avatarUpload = multer({ storage: makeStorage('avatars'), fileFilter, limits: limits(1) });

/** Kiểm tra "magic bytes" – chặn file giả mạo đuôi/mimetype. */
async function isRealImage(filePath) {
  const fh = await fsp.open(filePath, 'r');
  try {
    const buf = Buffer.alloc(12);
    await fh.read(buf, 0, 12, 0);
    const jpg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    const png = buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const webp = buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP';
    return jpg || png || webp;
  } finally {
    await fh.close();
  }
}

async function verifySignatures(req, _res, next) {
  const files = req.file ? [req.file] : req.files || [];
  for (const f of files) {
    if (!(await isRealImage(f.path))) {
      await cleanupRequestFiles(req);
      throw ApiError.badRequest(`File "${f.originalname}" không phải là ảnh hợp lệ`);
    }
  }
  next();
}

/** Upload nhiều ảnh sản phẩm (field: images). */
export const uploadProductImages = [productUpload.array('images', config.business.maxProductImages), verifySignatures];

/** Upload 1 ảnh đại diện (field: avatar). */
export const uploadAvatar = [avatarUpload.single('avatar'), verifySignatures];
