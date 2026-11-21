/**
 * Kết nối Microsoft SQL Server bằng thư viện `mssql`.
 * Hỗ trợ 2 driver (chọn qua DB_DRIVER trong .env):
 *  - tedious     : thuần JavaScript, kết nối TCP, dùng SQL login (sa / user riêng)
 *  - msnodesqlv8 : dùng ODBC, hỗ trợ LocalDB và Windows Authentication
 *
 * Mọi truy vấn đều đi qua helper `db.*` với tham số đặt tên (@param)
 * => không bao giờ nối chuỗi dữ liệu người dùng vào câu SQL (chống SQL Injection).
 */
import { config } from './env.js';

const driverModule =
  config.db.driver === 'msnodesqlv8'
    ? await import('mssql/msnodesqlv8.js')
    : await import('mssql');

/** Đối tượng `sql` của driver đang dùng (chứa các kiểu dữ liệu sql.Int, sql.NVarChar, ...). */
export const sql = driverModule.default;

function buildConfig() {
  const c = config.db;
  const pool = { max: 10, min: 0, idleTimeoutMillis: 30000 };

  if (c.driver === 'msnodesqlv8') {
    const auth = c.trustedConnection
      ? 'Trusted_Connection=yes;'
      : `Uid=${c.user};Pwd=${c.password};`;
    const encrypt = c.encrypt ? 'Encrypt=yes;' : 'Encrypt=no;';
    const trust = c.trustServerCertificate ? 'TrustServerCertificate=yes;' : '';
    return {
      connectionString: `Driver={${c.odbcDriver}};Server=${c.server};Database=${c.database};${auth}${encrypt}${trust}`,
      pool,
    };
  }

  const cfg = {
    server: c.server,
    database: c.database,
    user: c.user,
    password: c.password,
    pool,
    options: {
      encrypt: c.encrypt,
      trustServerCertificate: c.trustServerCertificate,
      enableArithAbort: true,
    },
    connectionTimeout: 15000,
    requestTimeout: 30000,
  };
  if (c.instance) cfg.options.instanceName = c.instance;
  if (c.port && !c.instance) cfg.port = c.port;
  if (c.port && c.instance) cfg.port = c.port; // port cố định cho named instance
  return cfg;
}

let poolPromise = null;

/** Lấy (hoặc khởi tạo) connection pool dùng chung. */
export async function getPool() {
  if (!poolPromise) {
    const pool = new sql.ConnectionPool(buildConfig());
    pool.on('error', (err) => console.error('[db] Pool error:', err.message));
    poolPromise = pool.connect().catch((err) => {
      poolPromise = null;
      throw err;
    });
  }
  return poolPromise;
}

export async function closePool() {
  if (poolPromise) {
    const pool = await poolPromise;
    poolPromise = null;
    await pool.close();
  }
}

/**
 * Gắn tham số vào request.
 * - Giá trị thường: `{ id: 5, title: 'abc' }` -> mssql tự suy luận kiểu.
 * - Chỉ định kiểu: `{ price: { type: sql.Decimal(12, 0), value: 1000 } }`
 */
function bindParams(request, params = {}) {
  for (const [name, raw] of Object.entries(params)) {
    if (raw && typeof raw === 'object' && 'type' in raw && 'value' in raw) {
      request.input(name, raw.type, raw.value ?? null);
    } else {
      request.input(name, raw === undefined ? null : raw);
    }
  }
}

/** Đổi PascalCase (cột SQL) -> camelCase (JSON API). */
const toCamel = (key) => key.charAt(0).toLowerCase() + key.slice(1);

export function camelize(row) {
  if (!row || typeof row !== 'object') return row;
  const out = {};
  for (const [k, v] of Object.entries(row)) out[toCamel(k)] = v;
  return out;
}

function createExecutor(target) {
  const run = async (text, params) => {
    const conn = target ?? (await getPool());
    const request = conn.request();
    bindParams(request, params);
    return request.query(text);
  };
  return {
    /** Trả về kết quả gốc của mssql (recordset, rowsAffected, ...). */
    query: run,
    /** Trả về mảng bản ghi (đã camelCase). */
    rows: async (text, params) => (await run(text, params)).recordset?.map(camelize) ?? [],
    /** Trả về bản ghi đầu tiên hoặc null. */
    one: async (text, params) => {
      const rs = (await run(text, params)).recordset;
      return rs && rs.length ? camelize(rs[0]) : null;
    },
    /** Trả về giá trị cột đầu tiên của dòng đầu tiên. */
    scalar: async (text, params) => {
      const rs = (await run(text, params)).recordset;
      if (!rs || !rs.length) return null;
      return Object.values(rs[0])[0];
    },
    /** Số dòng bị ảnh hưởng. */
    execute: async (text, params) => {
      const r = await run(text, params);
      return r.rowsAffected?.reduce((a, b) => a + b, 0) ?? 0;
    },
  };
}

/**
 * Chạy nhiều câu lệnh trong một SQL transaction.
 * Nếu callback ném lỗi -> ROLLBACK, ngược lại -> COMMIT.
 */
async function transaction(callback) {
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  await tx.begin();
  try {
    const result = await callback(createExecutor(tx));
    await tx.commit();
    return result;
  } catch (err) {
    try {
      await tx.rollback();
    } catch {
      /* transaction có thể đã bị SQL Server tự rollback */
    }
    throw err;
  }
}

export const db = { ...createExecutor(null), transaction };

/** Tạo danh sách tham số cho mệnh đề IN: inParams('c', ['A','B']) -> { sql: '@c0,@c1', params: {c0:'A', c1:'B'} } */
export function inParams(prefix, values) {
  const params = {};
  const names = values.map((v, i) => {
    params[`${prefix}${i}`] = v;
    return `@${prefix}${i}`;
  });
  return { sql: names.join(', '), params };
}

/** Escape ký tự đặc biệt của LIKE (dùng kèm ESCAPE '\'). */
export function likeParam(value) {
  return `%${String(value).replace(/[\\%_[]/g, (m) => `\\${m}`)}%`;
}
