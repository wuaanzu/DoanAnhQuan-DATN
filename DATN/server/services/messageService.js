import { db } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { emitToUser } from '../utils/realtime.js';
import { notify } from './notificationService.js';

const CONV_SELECT = `
  SELECT c.ConversationId, c.ProductId, c.CreatedAt, c.LastMessageAt,
         ou.UserId AS OtherUserId, ou.FullName AS OtherUserName, ou.Avatar AS OtherUserAvatar, ou.Status AS OtherUserStatus,
         p.Title AS ProductTitle, p.Price AS ProductPrice, p.TransactionType AS ProductType, p.Status AS ProductStatus,
         (SELECT TOP 1 i.ImageUrl FROM dbo.ProductImages i WHERE i.ProductId = p.ProductId
           ORDER BY i.IsPrimary DESC, i.SortOrder, i.ImageId) AS ProductImage,
         lm.Content AS LastMessage, lm.SenderId AS LastMessageSenderId, lm.SentAt AS LastMessageSentAt,
         (SELECT COUNT(*) FROM dbo.Messages m
           WHERE m.ConversationId = c.ConversationId AND m.SenderId <> @u AND m.IsRead = 0) AS UnreadCount
    FROM dbo.Conversations c
    JOIN dbo.Users ou ON ou.UserId = CASE WHEN c.User1Id = @u THEN c.User2Id ELSE c.User1Id END
    LEFT JOIN dbo.Products p ON p.ProductId = c.ProductId
    OUTER APPLY (SELECT TOP 1 m.Content, m.SenderId, m.SentAt FROM dbo.Messages m
                  WHERE m.ConversationId = c.ConversationId ORDER BY m.SentAt DESC, m.MessageId DESC) lm`;

export async function listConversations(userId) {
  return db.rows(
    `${CONV_SELECT}
      WHERE c.User1Id = @u OR c.User2Id = @u
      ORDER BY COALESCE(c.LastMessageAt, c.CreatedAt) DESC`,
    { u: userId },
  );
}

/** Lấy cuộc trò chuyện và đảm bảo người dùng là thành viên. */
export async function getConversation(conversationId, userId) {
  const conv = await db.one(`${CONV_SELECT} WHERE c.ConversationId = @id AND (c.User1Id = @u OR c.User2Id = @u)`, {
    id: conversationId,
    u: userId,
  });
  if (!conv) {
    const exists = await db.scalar('SELECT 1 FROM dbo.Conversations WHERE ConversationId = @id', { id: conversationId });
    if (exists) throw ApiError.forbidden('Bạn không tham gia cuộc trò chuyện này');
    throw ApiError.notFound('Không tìm thấy cuộc trò chuyện');
  }
  return conv;
}

/** Tìm hoặc tạo cuộc trò chuyện giữa 2 người (theo sản phẩm nếu có). */
export async function startConversation(user, { recipientId, productId, message }) {
  if (recipientId === user.id) throw ApiError.badRequest('Bạn không thể nhắn tin cho chính mình');
  const recipient = await db.one('SELECT UserId, Status FROM dbo.Users WHERE UserId = @id', { id: recipientId });
  if (!recipient) throw ApiError.notFound('Người nhận không tồn tại');
  if (recipient.status !== 'Active') throw ApiError.badRequest('Tài khoản người nhận đang bị khóa');
  if (productId) {
    const p = await db.scalar('SELECT 1 FROM dbo.Products WHERE ProductId = @id AND IsDeleted = 0', { id: productId });
    if (!p) throw ApiError.notFound('Tin đăng không tồn tại');
  }

  const [u1, u2] = user.id < recipientId ? [user.id, recipientId] : [recipientId, user.id];
  const findSql = `SELECT ConversationId FROM dbo.Conversations
                    WHERE User1Id = @u1 AND User2Id = @u2
                      AND ((@p IS NULL AND ProductId IS NULL) OR ProductId = @p)`;
  const params = { u1, u2, p: productId ?? null };

  let id = await db.scalar(findSql, params);
  if (!id) {
    try {
      id = await db.scalar(
        `INSERT INTO dbo.Conversations (User1Id, User2Id, ProductId) OUTPUT INSERTED.ConversationId VALUES (@u1, @u2, @p)`,
        params,
      );
    } catch (err) {
      // Hai request tạo cùng lúc -> vi phạm UNIQUE, đọc lại bản ghi đã tạo
      if (err?.number === 2627 || err?.number === 2601) id = await db.scalar(findSql, params);
      else throw err;
    }
  }
  if (message?.trim()) await sendMessage(user, { conversationId: id, content: message });
  return getConversation(id, user.id);
}

export async function listMessages(conversationId, userId, { before, limit = 30 }) {
  await getConversation(conversationId, userId);
  const rows = await db.rows(
    `SELECT TOP (@limit) MessageId, ConversationId, SenderId, Content, SentAt, IsRead, ReadAt
       FROM dbo.Messages
      WHERE ConversationId = @id AND (@before IS NULL OR MessageId < @before)
      ORDER BY MessageId DESC`,
    { id: conversationId, before: before ?? null, limit: limit + 1 },
  );
  const hasMore = rows.length > limit;
  return { items: rows.slice(0, limit).reverse(), hasMore };
}

export async function sendMessage(user, { conversationId, content }) {
  const conv = await db.one(
    'SELECT ConversationId, User1Id, User2Id FROM dbo.Conversations WHERE ConversationId = @id',
    { id: conversationId },
  );
  if (!conv) throw ApiError.notFound('Không tìm thấy cuộc trò chuyện');
  if (conv.user1Id !== user.id && conv.user2Id !== user.id) {
    throw ApiError.forbidden('Bạn không tham gia cuộc trò chuyện này');
  }
  const recipientId = conv.user1Id === user.id ? conv.user2Id : conv.user1Id;

  const message = await db.transaction(async (tx) => {
    const m = await tx.one(
      `INSERT INTO dbo.Messages (ConversationId, SenderId, Content)
       OUTPUT INSERTED.MessageId, INSERTED.ConversationId, INSERTED.SenderId, INSERTED.Content,
              INSERTED.SentAt, INSERTED.IsRead, INSERTED.ReadAt
       VALUES (@id, @sender, @content)`,
      { id: conversationId, sender: user.id, content: content.trim() },
    );
    await tx.execute('UPDATE dbo.Conversations SET LastMessageAt = SYSUTCDATETIME() WHERE ConversationId = @id', {
      id: conversationId,
    });
    return m;
  });

  emitToUser(recipientId, 'message:new', message);
  emitToUser(user.id, 'message:new', message);

  // Chỉ tạo 1 thông báo "Tin nhắn mới" chưa đọc cho mỗi cuộc trò chuyện (tránh spam)
  const existing = await db.scalar(
    `SELECT 1 FROM dbo.Notifications WHERE UserId = @u AND Type = 'Message' AND RelatedId = @id AND IsRead = 0`,
    { u: recipientId, id: conversationId },
  );
  if (!existing) {
    await notify({
      userId: recipientId,
      title: 'Tin nhắn mới',
      content: `${user.fullName} đã gửi cho bạn một tin nhắn.`,
      type: 'Message',
      relatedId: conversationId,
      link: `/messages/${conversationId}`,
    });
  }
  return message;
}

export async function markConversationRead(conversationId, userId) {
  const conv = await getConversation(conversationId, userId);
  const updated = await db.execute(
    `UPDATE dbo.Messages SET IsRead = 1, ReadAt = SYSUTCDATETIME()
      WHERE ConversationId = @id AND SenderId <> @u AND IsRead = 0`,
    { id: conversationId, u: userId },
  );
  await db.execute(
    `UPDATE dbo.Notifications SET IsRead = 1 WHERE UserId = @u AND Type = 'Message' AND RelatedId = @id AND IsRead = 0`,
    { id: conversationId, u: userId },
  );
  if (updated) emitToUser(conv.otherUserId, 'messages:read', { conversationId, readerId: userId });
  return { updated };
}

export async function unreadMessageCount(userId) {
  return Number(
    await db.scalar(
      `SELECT COUNT(*) FROM dbo.Messages m
         JOIN dbo.Conversations c ON c.ConversationId = m.ConversationId
        WHERE (c.User1Id = @u OR c.User2Id = @u) AND m.SenderId <> @u AND m.IsRead = 0`,
      { u: userId },
    ),
  );
}
