import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config/env.js';

/** Chuyển đường dẫn file vật lý -> URL public (/uploads/...). */
export function toPublicUrl(file) {
  const rel = path.relative(config.uploadDir, file.path).split(path.sep).join('/');
  return `/uploads/${rel}`;
}

/**
 * Xóa file đã upload theo URL public.
 * Chỉ xóa file trong uploads/products và uploads/avatars – KHÔNG xóa ảnh seed.
 */
export async function deleteUploadByUrl(url) {
  if (!url || typeof url !== 'string') return;
  if (!/^\/uploads\/(products|avatars)\/[\w.-]+$/.test(url)) return;
  const filePath = path.join(config.uploadDir, url.replace(/^\/uploads\//, ''));
  try {
    await fs.unlink(filePath);
  } catch {
    /* file có thể đã bị xóa trước đó */
  }
}

/** Xóa các file vừa upload trong request (khi validate thất bại hoặc có lỗi). */
export async function cleanupRequestFiles(req) {
  const files = [];
  if (req.file) files.push(req.file);
  if (Array.isArray(req.files)) files.push(...req.files);
  else if (req.files && typeof req.files === 'object') {
    Object.values(req.files).forEach((arr) => files.push(...arr));
  }
  await Promise.all(files.map((f) => fs.unlink(f.path).catch(() => {})));
}
