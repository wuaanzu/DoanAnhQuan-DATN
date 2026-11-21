import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  User,
  ShoppingBag,
  ExternalLink,
  Search,
  Sparkles,
  MapPin,
  Clock,
  CheckCheck,
  Package,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { messageService } from '@/services/messageService';
import heroImg from '@/assets/hero-unishare.png';

export default function Messages() {
  const { user, isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const initialConvId = searchParams.get('id');

  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  const messagesEndRef = useRef(null);

  // Cuộc trò chuyện mẫu phòng khi chưa có API
  const fallbackConversations = [
    {
      conversationId: 1,
      otherUserId: 5,
      otherUserName: 'Phạm Gia Bảo',
      otherUserAvatar: null,
      otherUserSchool: 'Học viện CNBC Viễn Thông (PTIT)',
      productTitle: 'Đèn bàn LED chống cận gập gọn',
      productPrice: 120000,
      productType: 'Sell',
      productImage: '/uploads/seed/p11.png',
      lastMessage: 'Ok bạn, hẹn gặp ở sảnh thư viện.',
      lastMessageSentAt: '14:20',
      unreadCount: 0,
    },
    {
      conversationId: 2,
      otherUserId: 3,
      otherUserName: 'Trần Thu Hà',
      otherUserAvatar: null,
      otherUserSchool: 'ĐHQG Hà Nội (UET)',
      productTitle: 'Sách Clean Code (bản tiếng Việt)',
      productPrice: 0,
      productType: 'Exchange',
      productImage: '/uploads/seed/p02.png',
      lastMessage: 'Mình đã chấp nhận, thứ 7 gặp ở cổng trường nha.',
      lastMessageSentAt: '09:15',
      unreadCount: 1,
    },
    {
      conversationId: 3,
      otherUserId: 4,
      otherUserName: 'Lê Hoàng Nam',
      otherUserAvatar: null,
      otherUserSchool: 'Đại học Kinh tế Quốc dân (NEU)',
      productTitle: 'Laptop Dell Latitude 7490 i5/8GB/256GB',
      productPrice: 5500000,
      productType: 'Sell',
      productImage: '/uploads/seed/p03.png',
      lastMessage: 'Laptop pin còn dùng được bao lâu vậy bạn?',
      lastMessageSentAt: 'Hôm qua',
      unreadCount: 0,
    },
  ];

  // Nạp danh sách hội thoại
  useEffect(() => {
    async function loadConversations() {
      setLoading(true);
      try {
        const list = await messageService.getConversations();
        if (list && list.length > 0) {
          setConversations(list);
          const defaultId = initialConvId ? Number(initialConvId) : list[0].conversationId;
          setActiveConvId(defaultId);
        } else {
          setConversations(fallbackConversations);
          setActiveConvId(fallbackConversations[0].conversationId);
        }
      } catch (err) {
        setConversations(fallbackConversations);
        setActiveConvId(fallbackConversations[0].conversationId);
      } finally {
        setLoading(false);
      }
    }
    loadConversations();
  }, [initialConvId]);

  // Nạp tin nhắn của cuộc trò chuyện đang chọn
  useEffect(() => {
    if (!activeConvId) return;

    async function loadMessages() {
      setLoadingMessages(true);
      try {
        const msgs = await messageService.getMessages(activeConvId);
        if (msgs && msgs.length > 0) {
          setMessages(msgs);
        } else {
          // Fallback messages
          if (activeConvId === 1) {
            setMessages([
              { messageId: 1, senderId: 5, content: 'Chào bạn, đèn bàn còn không ạ?', sentAt: '14:07' },
              { messageId: 2, senderId: user?.id || 2, content: 'Còn bạn nhé, đèn dùng rất giữ gìn.', sentAt: '14:09' },
              { messageId: 3, senderId: 5, content: 'Chiều mai 5h mình qua thư viện lấy được không?', sentAt: '14:12' },
              { messageId: 4, senderId: user?.id || 2, content: 'Ok bạn, hẹn gặp ở sảnh thư viện nhé!', sentAt: '14:20' },
            ]);
          } else if (activeConvId === 2) {
            setMessages([
              { messageId: 11, senderId: 3, content: 'Chào bạn, mình có cuốn Cấu trúc dữ liệu muốn đổi lấy cuốn Clean Code này được không?', sentAt: '09:00' },
              { messageId: 12, senderId: user?.id || 2, content: 'Được bạn ơi! Sách mình bản dịch còn mới lắm.', sentAt: '09:10' },
              { messageId: 13, senderId: 3, content: 'Mình đã chấp nhận, thứ 7 gặp ở cổng trường nha.', sentAt: '09:15' },
            ]);
          } else {
            setMessages([
              { messageId: 21, senderId: 4, content: 'Laptop pin còn dùng được bao lâu vậy bạn?', sentAt: 'Hôm qua' },
            ]);
          }
        }
        // Đánh dấu đã đọc
        messageService.markAsRead(activeConvId).catch(() => {});
      } catch (err) {
        console.error('Lỗi tải tin nhắn:', err);
      } finally {
        setLoadingMessages(false);
      }
    }
    loadMessages();
  }, [activeConvId, user?.id]);

  // Tự động cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cuộc trò chuyện hiện tại
  const currentConv = conversations.find((c) => c.conversationId === activeConvId);

  // Gửi tin nhắn
  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text || !activeConvId) return;

    const newMsg = {
      messageId: Date.now(),
      senderId: user?.id || 2,
      content: text,
      sentAt: 'Vừa xong',
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    // Cập nhật last message ở danh sách hội thoại
    setConversations((prev) =>
      prev.map((c) =>
        c.conversationId === activeConvId
          ? { ...c, lastMessage: text, lastMessageSentAt: 'Vừa xong', unreadCount: 0 }
          : c
      )
    );

    try {
      await messageService.sendMessage(activeConvId, text);
    } catch (err) {
      console.warn('Lưu tin nhắn lên server thất bại, đang dùng bộ nhớ tạm:', err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickReplies = [
    'Món đồ này còn không bạn?',
    'Bạn có bớt giá một chút được không?',
    'Chiều nay hẹn gặp ở thư viện trường được không?',
    'Tình trạng món đồ còn dùng tốt chứ bạn?',
  ];

  const filteredConversations = conversations.filter((c) => {
    const q = searchFilter.toLowerCase();
    return (
      c.otherUserName?.toLowerCase().includes(q) ||
      c.productTitle?.toLowerCase().includes(q) ||
      c.lastMessage?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-6xl mx-auto space-y-4 pb-12">
      {/* Tiêu đề trang */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Tin Nhắn Trao Đổi Đồ Cũ Sinh Viên</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 pl-10">
            Trao đổi thông tin món đồ, thương lượng giá và hẹn gặp trực tiếp trong khuôn viên trường
          </p>
        </div>
        <Link
          to="/"
          className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-1 self-start sm:self-center"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Quay lại Chợ đồ cũ
        </Link>
      </div>

      {/* KHUNG CHAT 2 CỘT */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-12 min-h-[620px] max-h-[750px]">
        {/* CỘT TRÁI: DANH SÁCH HỘI THOẠI (4 cols) */}
        <div className="md:col-span-5 lg:col-span-4 border-r border-slate-200 flex flex-col h-full bg-slate-50/50">
          {/* Ô tìm kiếm */}
          <div className="p-3.5 border-b border-slate-200 bg-white">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm bạn học hoặc tên món đồ..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 bg-slate-100 rounded-xl outline-none focus:bg-white focus:border-emerald-500 border border-transparent transition-all"
              />
            </div>
          </div>

          {/* Danh sách các cuộc trò chuyện */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Đang tải cuộc trò chuyện...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Package className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500">Chưa có tin nhắn nào</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isActive = conv.conversationId === activeConvId;
                return (
                  <button
                    key={conv.conversationId}
                    onClick={() => setActiveConvId(conv.conversationId)}
                    className={`w-full p-3.5 text-left transition-all flex items-start gap-3 hover:bg-slate-100/80 ${
                      isActive ? 'bg-emerald-50/90 border-l-4 border-emerald-600' : 'bg-transparent'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                        {conv.otherUserName?.charAt(0) || 'U'}
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>

                    {/* Nội dung tóm tắt */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-slate-900 truncate">{conv.otherUserName}</h4>
                        <span className="text-[10px] text-slate-400">{conv.lastMessageSentAt || 'Gần đây'}</span>
                      </div>

                      {/* Tag món đồ đang trao đổi */}
                      {conv.productTitle && (
                        <div className="flex items-center gap-1 text-[11px] text-emerald-800 font-semibold truncate bg-emerald-100/60 px-1.5 py-0.5 rounded-md w-fit max-w-full">
                          <ShoppingBag className="w-3 h-3 shrink-0 text-emerald-600" />
                          <span className="truncate">{conv.productTitle}</span>
                        </div>
                      )}

                      <p className="text-[11px] text-slate-500 truncate">{conv.lastMessage || 'Bắt đầu cuộc trò chuyện'}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* CỘT PHẢI: KHUNG CHAT (8 cols) */}
        <div className="md:col-span-7 lg:col-span-8 flex flex-col h-full bg-white">
          {currentConv ? (
            <>
              {/* Header người nhận */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                    {currentConv.otherUserName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 leading-tight">{currentConv.otherUserName}</h3>
                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                      Sinh viên đang trực tuyến
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-semibold">
                    Trao đổi an toàn
                  </span>
                </div>
              </div>

              {/* CARD GHIM SẢN PHẨM ĐANG THẢO LUẬN */}
              {currentConv.productTitle && (
                <div className="p-3 bg-emerald-50/80 border-b border-emerald-100 flex items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                      <Package className="w-6 h-6 text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                        Đang trao đổi về món đồ:
                      </span>
                      <h5 className="font-bold text-xs text-slate-900 truncate">{currentConv.productTitle}</h5>
                      <span className="text-xs font-extrabold text-emerald-700">
                        {currentConv.productType === 'Free'
                          ? 'Tặng 0đ'
                          : currentConv.productType === 'Exchange'
                          ? 'Trao đổi'
                          : `${Number(currentConv.productPrice || 0).toLocaleString('vi-VN')} đ`}
                      </span>
                    </div>
                  </div>

                  <Link
                    to="/"
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 px-3 py-1.5 rounded-lg bg-white border border-emerald-200 shadow-xs shrink-0 flex items-center gap-1"
                  >
                    Xem tin <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              )}

              {/* KHU VỰC DANH SÁCH TIN NHẮN */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/40">
                {loadingMessages ? (
                  <div className="py-12 text-center text-xs text-slate-400">Đang tải nội dung...</div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.senderId === (user?.id || 2);
                    return (
                      <div key={m.messageId} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div
                          className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-2.5 text-xs shadow-xs leading-relaxed ${
                            isMe
                              ? 'bg-emerald-600 text-white rounded-br-xs'
                              : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                          }`}
                        >
                          {m.content}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 px-1">
                          {m.sentAt ? m.sentAt.slice(-8, -3) || m.sentAt : 'Vừa xong'}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* GỢI Ý CÂU HỎI NHANH */}
              <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-[11px] scrollbar-none shrink-0">
                <span className="text-slate-400 font-semibold shrink-0">Hỏi nhanh:</span>
                {quickReplies.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-600 shrink-0 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Ô NHẬP TIN NHẮN & NÚT GỬI */}
              <div className="p-3 bg-white border-t border-slate-200 shrink-0">
                <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 focus-within:border-emerald-500 focus-within:bg-white transition-all">
                  <textarea
                    rows={1}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Nhắn tin hẹn địa điểm gặp, xem đồ trực tiếp trong trường..."
                    className="w-full text-xs px-3 py-1.5 bg-transparent outline-none resize-none placeholder:text-slate-400"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputText.trim()}
                    className="w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white flex items-center justify-center shrink-0 transition-all shadow-xs"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <MessageSquare className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">Chọn một cuộc trò chuyện</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Hãy chọn người mua hoặc người bán từ danh sách bên trái để bắt đầu trao đổi chi tiết về món đồ.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
