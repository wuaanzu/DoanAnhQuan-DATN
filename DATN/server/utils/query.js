/** Đọc page/limit từ query string một cách an toàn. */
export function parsePagination(query = {}, { defaultLimit = 12, maxLimit = 50 } = {}) {
  let page = Number.parseInt(query.page, 10);
  let limit = Number.parseInt(query.limit, 10);
  if (!Number.isFinite(page) || page < 1) page = 1;
  if (!Number.isFinite(limit) || limit < 1) limit = defaultLimit;
  limit = Math.min(limit, maxLimit);
  return { page, limit, offset: (page - 1) * limit };
}

/** Số nguyên dương hoặc undefined. */
export function toPositiveInt(value) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/** Số >= 0 hoặc undefined. */
export function toNonNegativeNumber(value) {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

/** Chuỗi "a,b,c" hoặc mảng -> mảng giá trị hợp lệ trong whitelist. */
export function toList(value, whitelist) {
  if (value === undefined || value === null || value === '') return [];
  const arr = Array.isArray(value) ? value : String(value).split(',');
  return [...new Set(arr.map((s) => String(s).trim()))].filter((s) => whitelist.includes(s));
}

export function toTrimmed(value, max = 200) {
  if (value === undefined || value === null) return undefined;
  const s = String(value).trim();
  return s ? s.slice(0, max) : undefined;
}
