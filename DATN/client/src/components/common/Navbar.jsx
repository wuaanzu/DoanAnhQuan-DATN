import { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Menu,
  X,
  User,
  LogOut,
  PlusCircle,
  ShieldCheck,
  MessageSquare,
  UserPlus,
  Bell,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Clock,
  MapPin,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { APP_CONFIG } from '@/utils/constants';
import Button from './Button';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  // Đóng dropdown thông báo khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const notifications = [
    {
      id: 1,
      title: 'Yêu cầu trao đổi được chấp thuận',
      desc: 'Nguyễn Minh Anh đồng ý đổi Giáo trình C++ lấy Kit STM32F4',
      time: '15 phút trước',
      unread: true,
      tag: 'Giao dịch',
    },
    {
      id: 2,
      title: 'Món đồ mới đăng tại KTX B4 PTIT',
      desc: 'Bàn học gấp gọn sinh viên vừa được đăng tặng 0đ',
      time: '1 giờ trước',
      unread: true,
      tag: 'KTX B4',
    },
    {
      id: 3,
      title: 'Tài khoản sinh viên PTIT đã xác thực',
      desc: 'Chào mừng bạn đến với cộng đồng trao đổi văn minh PTIT',
      time: 'Hôm qua',
      unread: false,
      tag: 'Hệ thống',
    },
  ];

  const navLinkClass = ({ isActive }) =>
    `px-3 py-2 rounded-xl text-xs md:text-sm font-semibold transition-colors ${
      isActive
        ? 'bg-emerald-50 text-emerald-700 shadow-xs'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  const adminNavLinkClass = ({ isActive }) =>
    `px-3 py-2 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-1.5 ${
      isActive
        ? 'bg-indigo-600 text-white shadow-xs'
        : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100'
    }`;

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 via-red-600 to-amber-500 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-slate-900 leading-tight">
                  {APP_CONFIG.NAME}
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 shadow-xs">
                  PTIT
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium block">
                Chợ đồ cũ sinh viên Học viện PTIT
              </span>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center gap-1.5">
            <NavLink to="/" className={navLinkClass}>
              Chợ đồ cũ PTIT
            </NavLink>

            {/* Menu cho người dùng đã đăng nhập (Sinh viên & Admin) */}
            {isAuthenticated && (
              <>
                <NavLink to="/dashboard" className={navLinkClass}>
                  Quản lý tin của tôi
                </NavLink>
                <NavLink to="/messages" className={navLinkClass}>
                  <span className="flex items-center gap-1.5 relative">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    Tin nhắn
                    <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center -top-1 -right-2">
                      2
                    </span>
                  </span>
                </NavLink>
              </>
            )}

            {/* Menu DÀNH RIÊNG CHO ADMIN */}
            {isAuthenticated && isAdmin && (
              <NavLink to="/admin" className={adminNavLinkClass}>
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                Quản trị hệ thống (Admin)
              </NavLink>
            )}

            <NavLink to="/about" className={navLinkClass}>
              Giới thiệu
            </NavLink>
          </div>

          {/* User actions */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-2.5">
                {/* Chuông thông báo */}
                <div className="relative" ref={notifRef}>
                  <button
                    type="button"
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="w-9 h-9 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-100/70 text-slate-600 flex items-center justify-center transition-colors relative"
                    title="Thông báo"
                  >
                    <Bell className="w-4 h-4" />
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-600 ring-2 ring-white"></span>
                  </button>

                  {/* Popover thông báo */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 space-y-2">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 px-1">
                        <span className="text-xs font-bold text-slate-900">Thông báo sinh viên</span>
                        <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                          2 tin mới
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`p-2.5 rounded-xl transition-colors text-left text-xs ${
                              n.unread ? 'bg-rose-50/60 border border-rose-100' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="font-bold text-slate-800 line-clamp-1">{n.title}</span>
                              <span className="text-[9px] text-slate-400 shrink-0">{n.time}</span>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-snug">{n.desc}</p>
                          </div>
                        ))}
                      </div>
                      <Link
                        to="/messages"
                        onClick={() => setShowNotifications(false)}
                        className="block text-center text-[11px] font-bold text-emerald-600 hover:underline pt-1"
                      >
                        Xem tất cả tin nhắn & trao đổi
                      </Link>
                    </div>
                  )}
                </div>

                {/* Nút đăng tin cho tất cả người dùng */}
                <Link to="/dashboard">
                  <Button size="sm" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm font-semibold hover:shadow-md transition-all">
                    <PlusCircle className="w-4 h-4 mr-1.5" />
                    Đăng tin đồ cũ
                  </Button>
                </Link>

                {/* Badge vai trò & Thông tin user */}
                <Link
                  to={isAdmin ? '/admin' : '/dashboard'}
                  className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-xl border transition-all ${
                    isAdmin
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-900 hover:bg-indigo-100'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <User className={`w-3.5 h-3.5 ${isAdmin ? 'text-indigo-600' : 'text-emerald-600'}`} />
                  <span className="font-bold truncate max-w-[120px]">
                    {user?.fullName || user?.name || 'Tài khoản'}
                  </span>
                  <span
                    className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${
                      isAdmin ? 'bg-indigo-600 text-white' : 'bg-rose-600 text-white'
                    }`}
                  >
                    {isAdmin ? 'ADMIN' : 'SV PTIT'}
                  </span>
                </Link>

                <Button variant="outline" size="sm" onClick={handleLogout} className="text-rose-600 border-rose-200 hover:bg-rose-50">
                  <LogOut className="w-3.5 h-3.5 mr-1" />
                  Đăng xuất
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="outline" size="sm" className="text-xs font-semibold">
                    Đăng nhập
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white text-xs font-semibold shadow-xs">
                    <UserPlus className="w-3.5 h-3.5 mr-1" />
                    Đăng ký PTIT
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-hidden"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2">
          <NavLink
            to="/"
            onClick={() => setIsOpen(false)}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-xl text-sm font-semibold ${
                isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600'
              }`
            }
          >
            Chợ đồ cũ sinh viên PTIT
          </NavLink>

          {isAuthenticated && (
            <>
              <NavLink
                to="/dashboard"
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-xl text-sm font-semibold ${
                    isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600'
                  }`
                }
              >
                Quản lý tin đăng của tôi
              </NavLink>
              <NavLink
                to="/messages"
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-xl text-sm font-semibold ${
                    isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600'
                  }`
                }
              >
                💬 Tin nhắn trao đổi
              </NavLink>
            </>
          )}

          {isAuthenticated && isAdmin && (
            <NavLink
              to="/admin"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-bold bg-indigo-50 text-indigo-700"
            >
              ⚙️ Quản trị hệ thống (Admin Portal)
            </NavLink>
          )}

          <NavLink
            to="/about"
            onClick={() => setIsOpen(false)}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-xl text-sm font-semibold ${
                isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600'
              }`
            }
          >
            Giới thiệu về UniShare PTIT
          </NavLink>

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            {isAuthenticated ? (
              <>
                <div className="px-3 py-1.5 text-xs text-slate-500 flex justify-between items-center">
                  <span>Đăng nhập: <strong>{user?.fullName || user?.name}</strong></span>
                  <span className="font-bold text-indigo-700 uppercase">[{user?.role || 'Sinh viên'}]</span>
                </div>
                <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                    <PlusCircle className="w-4 h-4 mr-1.5" />
                    Đăng tin đồ cũ
                  </Button>
                </Link>
                <Button variant="outline" onClick={handleLogout} className="w-full text-rose-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Đăng xuất
                </Button>
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <Link to="/login" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" className="w-full font-semibold">Đăng nhập</Button>
                </Link>
                <Link to="/register" onClick={() => setIsOpen(false)}>
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Đăng ký tài khoản sinh viên
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
