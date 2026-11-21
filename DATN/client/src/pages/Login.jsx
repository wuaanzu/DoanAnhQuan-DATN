import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, Lock, Mail, AlertCircle, ArrowLeft, ShieldCheck, UserCheck, UserPlus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/authService';

export default function Login() {
  const [email, setEmail] = useState('bao.pg@stu.ptit.edu.vn');
  const [password, setPassword] = useState('Unishare@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Vui lòng điền email và mật khẩu.');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.login({ email, password });
      login(response.user, response.token);

      // Chuyển hướng theo vai trò
      if (response.user?.role === 'Admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoAccount = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-6 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mx-auto shadow-md">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Đăng Nhập UniShare PTIT</h2>
          <p className="text-xs text-slate-500">
            Hệ thống phân quyền theo 2 vai trò: <strong>Quản trị viên (Admin)</strong> & <strong>Sinh viên PTIT (Người dùng)</strong>
          </p>
        </div>

        {/* 2 TÀI KHOẢN MẪU ĐỂ CHỌN NHANH */}
        <div className="space-y-2.5">
          <span className="text-xs font-bold text-slate-700 block">
            Chọn nhanh 1 trong 2 tài khoản thử nghiệm:
          </span>

          {/* Tài khoản 1: ADMIN */}
          <button
            type="button"
            onClick={() => setDemoAccount('admin@unishare.vn', 'Unishare@123')}
            className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
              email === 'admin@unishare.vn'
                ? 'border-indigo-500 bg-indigo-50/80 shadow-xs'
                : 'border-slate-200 bg-white hover:border-indigo-300'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                  1. Tài khoản ADMIN
                </span>
                <span className="text-[11px] text-slate-400 font-mono">admin@unishare.vn</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Toàn quyền quản trị website: quản lý danh mục, kiểm duyệt sản phẩm, xử lý báo cáo vi phạm, quản lý người dùng + có quyền mua bán như khách hàng.
              </p>
            </div>
          </button>

          {/* Tài khoản 2: NGƯỜI DÙNG PTIT */}
          <button
            type="button"
            onClick={() => setDemoAccount('bao.pg@stu.ptit.edu.vn', 'Unishare@123')}
            className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
              email === 'bao.pg@stu.ptit.edu.vn'
                ? 'border-rose-500 bg-rose-50/80 shadow-xs'
                : 'border-slate-200 bg-white hover:border-rose-300'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <UserCheck className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-rose-800 bg-rose-100 px-2 py-0.5 rounded">
                  2. Tài khoản SINH VIÊN PTIT
                </span>
                <span className="text-[11px] text-slate-400 font-mono">bao.pg@stu.ptit.edu.vn</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Sinh viên Phạm Gia Bảo (PTIT - Khoa CNTT): Mua, bán đồ cũ, giáo trình, kit thực hành, quản lý tin đăng, nhắn tin trực tiếp với người bán / người mua.
              </p>
            </div>
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Email đăng nhập *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@unishare.vn hoặc email sinh viên"
                className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition-colors font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Mật khẩu *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition-colors font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 ${
              email === 'admin@unishare.vn'
                ? 'bg-indigo-600 hover:bg-indigo-700'
                : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            {loading
              ? 'Đang xác thực tài khoản...'
              : email === 'admin@unishare.vn'
              ? 'Đăng nhập với quyền ADMIN'
              : 'Đăng nhập với quyền SINH VIÊN PTIT'}
          </button>
        </form>

        {/* Chưa có tài khoản? Đăng ký ngay */}
        <div className="pt-2 border-t border-slate-100 space-y-3">
          <div className="text-center text-xs text-slate-600">
            Bạn là tân sinh viên hoặc chưa có tài khoản?{' '}
            <Link
              to="/register"
              className="text-emerald-600 font-bold hover:underline inline-flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Đăng ký tài khoản ngay
            </Link>
          </div>

          <div className="text-center">
            <Link to="/" className="inline-flex items-center text-xs text-slate-400 hover:text-emerald-600 transition-colors gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Xem Chợ đồ cũ sinh viên
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
