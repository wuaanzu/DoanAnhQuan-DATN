/**
 * Realtime bằng Socket.IO.
 * - Xác thực bằng chính cookie JWT HttpOnly trong handshake.
 * - Mỗi user join phòng `user:<id>` -> server gửi tin nhắn / thông báo tới đúng người.
 * - Nếu Socket.IO chưa khởi tạo (VD: chạy script), emitToUser chỉ bỏ qua – REST API vẫn hoạt động.
 */
import { Server } from 'socket.io';
import { config } from '../config/env.js';
import { db } from '../config/db.js';
import { readTokenFromCookieHeader, verifyToken } from './jwt.js';

let io = null;
const participantCache = new Map(); // conversationId -> [user1, user2]

async function getParticipants(conversationId) {
  if (participantCache.has(conversationId)) return participantCache.get(conversationId);
  const row = await db.one(
    'SELECT User1Id, User2Id FROM dbo.Conversations WHERE ConversationId = @id',
    { id: conversationId },
  );
  const result = row ? [row.user1Id, row.user2Id] : null;
  if (result) participantCache.set(conversationId, result);
  return result;
}

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: config.clientUrls, credentials: true },
  });

  io.use(async (socket, next) => {
    try {
      const token = readTokenFromCookieHeader(socket.handshake.headers.cookie);
      if (!token) return next(new Error('UNAUTHORIZED'));
      const payload = verifyToken(token);
      const user = await db.one(
        'SELECT UserId, Status, TokenVersion FROM dbo.Users WHERE UserId = @id',
        { id: Number(payload.sub) },
      );
      if (!user || user.status !== 'Active' || user.tokenVersion !== payload.tv) {
        return next(new Error('UNAUTHORIZED'));
      }
      socket.data.userId = user.userId;
      return next();
    } catch {
      return next(new Error('UNAUTHORIZED'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    socket.join(`user:${userId}`);

    // Hiển thị "đang soạn tin..." cho người còn lại trong cuộc trò chuyện
    socket.on('typing', async ({ conversationId, isTyping } = {}) => {
      const id = Number(conversationId);
      if (!Number.isInteger(id)) return;
      const parts = await getParticipants(id).catch(() => null);
      if (!parts || !parts.includes(userId)) return;
      const other = parts[0] === userId ? parts[1] : parts[0];
      io.to(`user:${other}`).emit('typing', { conversationId: id, userId, isTyping: Boolean(isTyping) });
    });
  });

  return io;
}

export function emitToUser(userId, event, payload) {
  if (!io || !userId) return;
  io.to(`user:${userId}`).emit(event, payload);
}
