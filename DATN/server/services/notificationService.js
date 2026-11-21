import { db } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { paginated } from '../utils/response.js';
import { emitToUser } from '../utils/realtime.js';

/**
 * Tạo một thông báo và đẩy realtime tới người nhận.
 * @param {{userId:number,title:string,content?:string,type:string,relatedId?:number,link?:string}} n
 * @param executor  db hoặc executor trong transaction (mặc định db)
 */
export async function notify(n, executor = db) {
  const row = await executor.one(
    `INSERT INTO dbo.Notifications (UserId, Title, Content, Type, RelatedId, Link)
     OUTPUT INSERTED.*
     VALUES (@userId, @title, @content, @type, @relatedId, @link)`,
    {
      userId: n.userId,
      title: n.title,
      content: n.content ?? null,
      type: n.type,
      relatedId: n.relatedId ?? null,
      link: n.link ?? null,
    },
  );
  if (executor === db) emitToUser(n.userId, 'notification:new', row);
  return row;
}

/** Gửi nhiều thông báo (dùng SAU khi transaction đã commit). */
export async function notifyMany(list) {
  for (const n of list) {
    // eslint-disable-next-line no-await-in-loop
    await notify(n).catch((err) => console.error('[notify] failed:', err.message));
  }
}

/** Thông báo tới toàn bộ quản trị viên đang hoạt động. */
export async function notifyAdmins(n) {
  const admins = await db.rows(`SELECT UserId FROM dbo.Users WHERE Role = 'Admin' AND Status = 'Active'`);
  await notifyMany(admins.map((a) => ({ ...n, userId: a.userId })));
}

export async function list(userId, { page, limit, offset, unreadOnly }) {
  const rows = await db.rows(
    `SELECT NotificationId, Title, Content, Type, RelatedId, Link, IsRead, CreatedAt,
            COUNT(*) OVER() AS TotalCount
       FROM dbo.Notifications
      WHERE UserId = @userId AND (@unreadOnly = 0 OR IsRead = 0)
      ORDER BY CreatedAt DESC, NotificationId DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
    { userId, unreadOnly: unreadOnly ? 1 : 0, offset, limit },
  );
  return paginated(rows, { page, limit });
}

export async function unreadCount(userId) {
  return Number(
    await db.scalar('SELECT COUNT(*) FROM dbo.Notifications WHERE UserId = @userId AND IsRead = 0', { userId }),
  );
}

export async function markRead(userId, notificationId) {
  const affected = await db.execute(
    'UPDATE dbo.Notifications SET IsRead = 1 WHERE NotificationId = @id AND UserId = @userId',
    { id: notificationId, userId },
  );
  if (!affected) throw ApiError.notFound('Không tìm thấy thông báo');
}

export async function markAllRead(userId) {
  return db.execute('UPDATE dbo.Notifications SET IsRead = 1 WHERE UserId = @userId AND IsRead = 0', { userId });
}

export async function remove(userId, notificationId) {
  const affected = await db.execute(
    'DELETE FROM dbo.Notifications WHERE NotificationId = @id AND UserId = @userId',
    { id: notificationId, userId },
  );
  if (!affected) throw ApiError.notFound('Không tìm thấy thông báo');
}
