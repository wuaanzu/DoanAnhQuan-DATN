import api from './api';

export const messageService = {
  // Lấy danh sách các cuộc hội thoại
  getConversations: async () => {
    try {
      const res = await api.get('/messages/conversations');
      return res.data || res || [];
    } catch (err) {
      console.error('Lỗi lấy danh sách hội thoại:', err);
      return [];
    }
  },

  // Chi tiết cuộc hội thoại
  getConversation: async (id) => {
    const res = await api.get(`/messages/conversations/${id}`);
    return res.data || res;
  },

  // Bắt đầu hoặc mở cuộc hội thoại về sản phẩm
  startConversation: async ({ recipientId, productId, message }) => {
    const res = await api.post('/messages/start', {
      recipientId,
      productId,
      message,
    });
    return res.data || res;
  },

  // Lấy tin nhắn trong cuộc hội thoại
  getMessages: async (conversationId) => {
    try {
      const res = await api.get(`/messages/conversations/${conversationId}/messages`);
      return res.data?.items ? res.data.items : (Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Lỗi lấy tin nhắn:', err);
      return [];
    }
  },

  // Gửi tin nhắn mới
  sendMessage: async (conversationId, content) => {
    const res = await api.post(`/messages/conversations/${conversationId}/messages`, { content });
    return res.data || res;
  },

  // Đánh dấu đã đọc
  markAsRead: async (conversationId) => {
    const res = await api.put(`/messages/conversations/${conversationId}/read`);
    return res.data || res;
  },

  // Số tin nhắn chưa đọc
  getUnreadCount: async () => {
    try {
      const res = await api.get('/messages/unread-count');
      return res.data?.unreadCount ?? 0;
    } catch {
      return 0;
    }
  },
};
