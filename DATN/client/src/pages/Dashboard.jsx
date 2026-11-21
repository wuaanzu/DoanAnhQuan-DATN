import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  CheckCircle,
  Clock,
  TrendingUp,
  Plus,
  Search,
  Filter,
  Trash2,
  Tag,
  Repeat,
  Gift,
  MapPin,
  Eye,
  AlertCircle,
  MessageSquare,
  ShieldCheck,
  CheckCheck,
  XCircle,
  PieChart,
  BarChart3,
  Building2,
  BookOpen,
  Laptop,
  Users,
  DollarSign,
  ArrowUpRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import { productService } from '@/services/productService';

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('my-items');
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [universities, setUniversities] = useState([]);

  // Form đăng tin mới
  const [newItem, setNewItem] = useState({
    title: '',
    categoryId: 1,
    transactionType: 'Sell',
    price: '',
    condition: 'Good',
    desiredExchange: '',
    location: '',
    description: '',
  });

  // Dữ liệu tin đăng mẫu của sinh viên
  const [myItems, setMyItems] = useState([
    {
      id: 101,
      title: 'Giáo trình Cấu trúc dữ liệu & Giải thuật PTIT',
      category: 'Giáo trình',
      price: 25000,
      type: 'Sell',
      condition: 'Còn rất tốt',
      status: 'Active',
      views: 85,
      createdAt: '15/10/2026',
      location: 'Giảng đường A2 - PTIT, Km10 Nguyễn Trãi',
    },
    {
      id: 102,
      title: 'Áo khoác gió đồng phục PTIT màu đỏ mận size L',
      category: 'Quần áo',
      price: 0,
      type: 'Free',
      condition: 'Còn rất tốt',
      status: 'Active',
      views: 92,
      createdAt: '18/10/2026',
      location: 'Căng tin PTIT - Cạnh sân bóng',
    },
    {
      id: 103,
      title: 'Board Arduino Uno R3 + Cảm biến thực hành IoT PTIT',
      category: 'Đồ điện tử',
      price: 160000,
      type: 'Sell',
      condition: 'Mới 99%',
      status: 'Completed',
      views: 74,
      createdAt: '05/10/2026',
      location: 'Ký túc xá B4 PTIT Hà Đông',
    },
    {
      id: 104,
      title: 'Sách Kiến trúc máy tính & Hợp ngữ Assembly (PTIT)',
      category: 'Giáo trình',
      price: 0,
      type: 'Exchange',
      condition: 'Còn rất tốt',
      status: 'Active',
      views: 53,
      createdAt: '20/10/2026',
      location: 'Thư viện PTIT tầng 2 - Nhà A1',
    },
  ]);

  // Yêu cầu giao dịch
  const [requests, setRequests] = useState([
    {
      id: 201,
      itemTitle: 'Giáo trình Cấu trúc dữ liệu & Giải thuật PTIT',
      buyerName: 'Trần Thu Hà',
      buyerSchool: 'PTIT - Khoa An toàn thông tin',
      buyerPhone: '0981 234 567',
      type: 'Mua lại',
      offered: '25.000 đ',
      message: 'Chào bạn, chiều nay tầm 4h mình gặp nhau ở Giảng đường A2 lấy sách được không?',
      status: 'Pending',
      createdAt: 'Hôm nay, 14:20',
      meetingPlace: 'Sảnh tầng 1 Giảng đường A2 PTIT',
    },
    {
      id: 202,
      itemTitle: 'Áo khoác gió đồng phục PTIT màu đỏ mận size L',
      buyerName: 'Lê Hoàng Nam',
      buyerSchool: 'PTIT - Khoa Đa phương tiện',
      buyerPhone: '0972 345 678',
      type: 'Xin nhận tặng',
      offered: 'Miễn phí 0đ',
      message: 'Em là D24 tân sinh viên mới vào trường PTIT, anh cho em xin lại áo đồng phục này nhé!',
      status: 'Accepted',
      createdAt: 'Hôm qua, 09:15',
      meetingPlace: 'Cổng KTX Nhà B4 PTIT',
    },
    {
      id: 203,
      itemTitle: 'Đèn bàn LED chống cận gập gọn',
      buyerName: 'Phạm Gia Bảo',
      buyerSchool: 'PTIT - Bưu Chính Viễn Thông',
      buyerPhone: '0963 456 789',
      type: 'Mua lại',
      offered: '120.000 đ',
      message: 'Đã hoàn tất nhận đèn và gửi tiền mặt cho bạn.',
      status: 'Completed',
      createdAt: '08/10/2026',
      meetingPlace: 'Cổng KTX Bách Khoa',
    },
  ]);

  useEffect(() => {
    async function loadCatalog() {
      const [cats, unis] = await Promise.all([
        productService.getCategories(),
        productService.getUniversities(),
      ]);
      setCategories(cats || []);
      setUniversities(unis || []);
    }
    loadCatalog();
  }, []);

  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!newItem.title.trim()) {
      alert('Vui lòng nhập tên món đồ!');
      return;
    }
    const catName = categories.find((c) => c.categoryId === Number(newItem.categoryId))?.categoryName || 'Khác';
    const createdItem = {
      id: Date.now(),
      title: newItem.title,
      category: catName,
      price: newItem.transactionType === 'Free' ? 0 : Number(newItem.price) || 0,
      type: newItem.transactionType,
      condition: newItem.condition === 'New' ? 'Mới 99%' : newItem.condition === 'Good' ? 'Còn rất tốt' : 'Đã qua sử dụng',
      status: 'Active',
      views: 1,
      createdAt: 'Vừa xong',
      location: newItem.location || 'Khuôn viên trường',
    };
    setMyItems([createdItem, ...myItems]);
    alert('Đăng tin đồ cũ thành công! Món đồ đã hiển thị trên chợ sinh viên.');
    setActiveTab('my-items');
    setNewItem({
      title: '',
      categoryId: 1,
      transactionType: 'Sell',
      price: '',
      condition: 'Good',
      desiredExchange: '',
      location: '',
      description: '',
    });
  };

  // Tổng hợp thống kê
  const activeCount = myItems.filter((i) => i.status === 'Active').length;
  const completedCount = myItems.filter((i) => i.status === 'Completed').length;
  const totalViews = myItems.reduce((acc, curr) => acc + curr.views, 0);
  const pendingRequests = requests.filter((r) => r.status === 'Pending').length;

  const stats = [
    { title: 'Tin đồ cũ đang đăng', value: activeCount, change: 'Đang hiển thị', icon: Package, color: 'text-emerald-600 bg-emerald-50' },
    { title: 'Yêu cầu chờ xử lý', value: pendingRequests, change: `${pendingRequests} sinh viên hẹn gặp`, icon: Clock, color: 'text-amber-600 bg-amber-50' },
    { title: 'Món đồ đã trao tay', value: completedCount, change: 'Giao dịch thành công', icon: CheckCircle, color: 'text-blue-600 bg-blue-50' },
    { title: 'Tổng lượt quan tâm', value: totalViews, change: 'Lượt xem tin đăng', icon: TrendingUp, color: 'text-teal-600 bg-teal-50' },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* HEADER BANNER QUẢN LÝ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white p-6 rounded-3xl shadow-md border border-rose-900/40">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-bold tracking-wide text-rose-300 border border-white/10">
            <Building2 className="w-3.5 h-3.5 text-rose-400" />
            Hệ Thống Quản Lý Trao Đổi Đồ Cũ Sinh Viên PTIT
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Bảng Điều Khiển Quản Lý</h1>
          <p className="text-xs md:text-sm text-slate-300 max-w-xl">
            Quản trị các món đồ cũ đã đăng, theo dõi yêu cầu mua/trao đổi và duyệt các giao dịch trực tiếp trong khuôn viên Học viện PTIT.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('create')}
            className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-md shrink-0"
          >
            <Plus className="w-4 h-4" />
            Đăng tin đồ cũ mới
          </button>
        </div>
      </div>

      {/* THẺ THỐNG KÊ NHANH */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-slate-500 font-medium block">{s.title}</span>
                <span className="text-2xl font-extrabold text-slate-900 block">{s.value}</span>
                <span className="text-[11px] text-emerald-600 font-medium">{s.change}</span>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${s.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* THANH TAB ĐIỀU HƯỚNG QUẢN LÝ */}
      <div className="flex flex-wrap border-b border-slate-200 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('my-items')}
          className={`pb-3 relative transition-colors flex items-center gap-2 ${
            activeTab === 'my-items' ? 'text-rose-700 border-b-2 border-rose-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          Quản lý tin đăng ({myItems.length})
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 relative transition-colors flex items-center gap-2 ${
            activeTab === 'requests' ? 'text-rose-700 border-b-2 border-rose-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Repeat className="w-4 h-4" />
          Yêu cầu giao dịch ({requests.length})
          {pendingRequests > 0 && (
            <span className="px-2 py-0.5 text-[10px] rounded-full bg-rose-600 text-white font-bold">
              {pendingRequests} mới
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('create')}
          className={`pb-3 relative transition-colors flex items-center gap-2 ${
            activeTab === 'create' ? 'text-rose-700 border-b-2 border-rose-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Plus className="w-4 h-4" />
          Tạo tin đăng mới
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 relative transition-colors flex items-center gap-2 ${
            activeTab === 'analytics' ? 'text-rose-700 border-b-2 border-rose-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Thống kê & Báo cáo đề tài
        </button>

        <Link
          to="/messages"
          className="pb-3 text-emerald-700 hover:text-emerald-900 flex items-center gap-1.5 transition-colors sm:ml-auto font-bold text-xs bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200"
        >
          <MessageSquare className="w-4 h-4 text-emerald-600" />
          Mở Hộp thư & Chat trao đổi (3)
        </Link>
      </div>

      {/* TAB 1: QUẢN LÝ TIN ĐĂNG CỦA TÔI */}
      {activeTab === 'my-items' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-2">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-3 items-center">
            <div className="relative w-full sm:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm theo tên món đồ hoặc địa điểm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 bg-slate-50 focus:bg-white transition-all"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Đang quản lý <strong>{myItems.length}</strong> món đồ cũ</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Tên món đồ</th>
                  <th className="py-3 px-4">Danh mục</th>
                  <th className="py-3 px-4">Hình thức & Giá</th>
                  <th className="py-3 px-4">Địa điểm hẹn</th>
                  <th className="py-3 px-4">Tình trạng</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myItems
                  .filter((i) => i.title.toLowerCase().includes(searchTerm.toLowerCase()) || i.location?.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 max-w-[220px]">
                        <div className="truncate">{item.title}</div>
                        <span className="text-[11px] text-slate-400 font-normal">Đăng ngày {item.createdAt} • {item.views} lượt xem</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {item.type === 'Free' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold text-purple-700 bg-purple-50">Tặng 0đ</span>
                        ) : item.type === 'Exchange' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold text-blue-700 bg-blue-50">Trao đổi</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold text-emerald-800 bg-emerald-50">
                            {item.price.toLocaleString('vi-VN')} đ
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate max-w-[140px]">{item.location}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">{item.condition}</td>
                      <td className="py-3.5 px-4">
                        {item.status === 'Active' ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5"></span>
                            Đang hiển thị
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
                            Đã giao dịch
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        {item.status === 'Active' ? (
                          <button
                            onClick={() => {
                              setMyItems(myItems.map((m) => (m.id === item.id ? { ...m, status: 'Completed' } : m)));
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[11px] transition-colors"
                          >
                            Đã trao đổi
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setMyItems(myItems.map((m) => (m.id === item.id ? { ...m, status: 'Active' } : m)));
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] transition-colors"
                          >
                            Mở lại
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm('Bạn có chắc chắn muốn xóa tin đăng này?')) {
                              setMyItems(myItems.filter((m) => m.id !== item.id));
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold text-[11px] transition-colors"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: QUẢN LÝ YÊU CẦU GIAO DỊCH */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold">Quy trình giao dịch an toàn trong khuôn viên trường:</h4>
              <p className="mt-0.5 text-blue-800">
                1. Sinh viên gửi yêu cầu & đề xuất hẹn gặp ➜ 2. Người bán phê duyệt ➜ 3. Gặp mặt trực tiếp kiểm tra đồ ➜ 4. Xác nhận hoàn tất giao dịch.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {requests.map((r) => (
              <div key={r.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded">
                      {r.type}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base mt-1">{r.itemTitle}</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">{r.createdAt}</span>
                    {r.status === 'Pending' ? (
                      <span className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Chờ bạn xác nhận
                      </span>
                    ) : r.status === 'Accepted' ? (
                      <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center gap-1">
                        <CheckCheck className="w-3.5 h-3.5" /> Đã đồng ý hẹn gặp
                      </span>
                    ) : (
                      <span className="text-xs px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Đã hoàn thành
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block">Thông tin sinh viên gửi yêu cầu:</span>
                    <p className="font-bold text-slate-800 text-sm">{r.buyerName}</p>
                    <p className="text-slate-600">Trường: {r.buyerSchool}</p>
                    <p className="text-slate-600">Liên hệ: {r.buyerPhone}</p>
                  </div>

                  <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block">Nội dung trao đổi & Hẹn gặp:</span>
                    <p className="text-slate-700 italic">"{r.message}"</p>
                    <p className="text-emerald-700 font-semibold flex items-center gap-1 pt-1">
                      <MapPin className="w-3.5 h-3.5" /> Địa điểm: {r.meetingPlace}
                    </p>
                  </div>
                </div>

                {r.status === 'Pending' && (
                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setRequests(requests.map((req) => (req.id === r.id ? { ...req, status: 'Accepted' } : req)));
                        alert('Đã chấp nhận yêu cầu hẹn gặp! Hãy liên hệ với bạn ấy qua SĐT để thống nhất giờ nhé.');
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                    >
                      <CheckCheck className="w-4 h-4" />
                      Đồng ý giao dịch & hẹn gặp
                    </button>
                    <button
                      onClick={() => {
                        setRequests(requests.filter((req) => req.id !== r.id));
                      }}
                      className="border border-slate-200 hover:bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold"
                    >
                      Từ chối
                    </button>
                  </div>
                )}

                {r.status === 'Accepted' && (
                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setRequests(requests.map((req) => (req.id === r.id ? { ...req, status: 'Completed' } : req)));
                        alert('Tuyệt vời! Chúc mừng hai bạn đã hoàn thành trao đổi đồ cũ thành công.');
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Xác nhận đã trao đồ xong
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: FORM ĐĂNG TIN ĐỒ CŨ MỚI */}
      {activeTab === 'create' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-xs max-w-2xl mx-auto space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Đăng Tin Món Đồ Cũ Sinh Viên</h2>
            <p className="text-xs text-slate-500 mt-1">
              Điền thông tin chi tiết để sinh viên cùng trường có thể tìm kiếm và trao đổi dễ dàng nhất.
            </p>
          </div>

          <form onSubmit={handleCreatePost} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Tên món đồ cần thanh lý / chia sẻ *</label>
              <input
                type="text"
                required
                placeholder="VD: Máy tính Casio FX-580VN X, Giáo trình Giải tích 2, Quạt bàn mini..."
                value={newItem.title}
                onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 bg-slate-50 focus:bg-white transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Danh mục đồ dùng *</label>
                <select
                  value={newItem.categoryId}
                  onChange={(e) => setNewItem({ ...newItem, categoryId: e.target.value })}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.categoryId} value={c.categoryId}>
                      {c.categoryName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Hình thức giao dịch *</label>
                <select
                  value={newItem.transactionType}
                  onChange={(e) => setNewItem({ ...newItem, transactionType: e.target.value })}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 bg-white"
                >
                  <option value="Sell">Bán lại giá sinh viên</option>
                  <option value="Free">Tặng miễn phí 0đ</option>
                  <option value="Exchange">Trao đổi đồ khác</option>
                </select>
              </div>
            </div>

            {newItem.transactionType === 'Sell' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Giá bán (VNĐ) *</label>
                <input
                  type="number"
                  placeholder="VD: 50000"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 bg-slate-50 focus:bg-white transition-all"
                />
              </div>
            )}

            {newItem.transactionType === 'Exchange' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Món đồ bạn muốn nhận lại *</label>
                <input
                  type="text"
                  placeholder="VD: Muốn đổi lấy sách Tiếng Anh TOEIC hoặc vở vẽ A3..."
                  value={newItem.desiredExchange}
                  onChange={(e) => setNewItem({ ...newItem, desiredExchange: e.target.value })}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 bg-slate-50 focus:bg-white transition-all"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Tình trạng món đồ</label>
                <select
                  value={newItem.condition}
                  onChange={(e) => setNewItem({ ...newItem, condition: e.target.value })}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 bg-white"
                >
                  <option value="New">Mới 99 - 100%</option>
                  <option value="Good">Còn rất tốt, dùng ngon lành</option>
                  <option value="Used">Đã qua sử dụng, có xước nhẹ</option>
                  <option value="NeedsRepair">Cần sửa chữa nhẹ</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Địa điểm hẹn gặp trong khuôn viên PTIT</label>
                <input
                  type="text"
                  placeholder="VD: Sảnh Giảng đường A2, Thư viện A1, KTX B4 PTIT..."
                  value={newItem.location}
                  onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 bg-slate-50 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Mô tả thêm về món đồ</label>
              <textarea
                rows={3}
                placeholder="Mô tả kỹ tình trạng sản phẩm, phụ kiện đi kèm, lý do không dùng nữa..."
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 bg-slate-50 focus:bg-white transition-all"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Đăng tin đồ cũ ngay
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: THỐNG KÊ & BÁO CÁO ĐỀ TÀI */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Báo Cáo Tác Động Của Nền Tảng UniShare</h3>
            <p className="text-xs text-slate-500">
              Đo lường hiệu quả kinh tế & bảo vệ môi trường thông qua việc tái sử dụng đồ dùng cũ giữa các sinh viên.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span className="text-xs font-medium text-emerald-800">Ước tính số tiền SV tiết kiệm được</span>
                <div className="text-2xl font-black text-emerald-700 mt-1">~ 18.500.000 đ</div>
                <span className="text-[11px] text-emerald-600 mt-1 block">So với việc mua mới 100%</span>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
                <span className="text-xs font-medium text-blue-800">Món đồ được tái sử dụng</span>
                <div className="text-2xl font-black text-blue-700 mt-1">48 món đồ</div>
                <span className="text-[11px] text-blue-600 mt-1 block">Giáo trình, điện tử & đồ gia dụng</span>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
                <span className="text-xs font-medium text-rose-800">Phạm vi mạng lưới</span>
                <div className="text-2xl font-black text-rose-700 mt-1">Học viện PTIT</div>
                <span className="text-[11px] text-rose-600 mt-1 block">Cơ sở Hà Đông & Hoàng Quốc Việt</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="font-bold text-slate-900 text-sm">Phân Bổ Theo Danh Mục Đồ Cũ</h4>
              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between py-1 font-medium">
                    <span>Giáo trình & Sách học</span>
                    <span className="text-slate-500">38%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-600 rounded-full" style={{ width: '38%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between py-1 font-medium">
                    <span>Đồ điện tử & Công nghệ</span>
                    <span className="text-slate-500">26%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: '26%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between py-1 font-medium">
                    <span>Đồ gia dụng phòng trọ</span>
                    <span className="text-slate-500">20%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '20%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between py-1 font-medium">
                    <span>Dụng cụ học tập & Khác</span>
                    <span className="text-slate-500">16%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: '16%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="font-bold text-slate-900 text-sm">Hình Thức Trao Đổi Phổ Biến</h4>
              <div className="space-y-3 pt-1 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-emerald-700" />
                    <span className="font-bold text-slate-800">Bán lại giá rẻ</span>
                  </div>
                  <span className="font-extrabold text-emerald-700">65% tổng tin</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50 border border-purple-100">
                  <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-purple-700" />
                    <span className="font-bold text-slate-800">Tặng miễn phí 0đ</span>
                  </div>
                  <span className="font-extrabold text-purple-700">22% tổng tin</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-100">
                  <div className="flex items-center gap-2">
                    <Repeat className="w-4 h-4 text-blue-700" />
                    <span className="font-bold text-slate-800">Trao đổi đồ ngang giá</span>
                  </div>
                  <span className="font-extrabold text-blue-700">13% tổng tin</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
