import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShoppingBag,
  User,
  GraduationCap,
  Mail,
  Lock,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/authService';
import { productService } from '@/services/productService';

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    studentCode: '',
    universityId: '4', // Mặc định PTIT
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Đảm bảo universityId luôn là 4 (PTIT)
  useEffect(() => {
    setFormData((prev) => ({ ...prev, universityId: 4 }));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Kiểm tra tính hợp lệ cơ bản
    if (!formData.fullName.trim()) {
      setError('Vui lòng nhập họ và tên của bạn.');
      return;
    }
    if (!formData.studentCode.trim()) {
      setError('Vui lòng nhập mã số sinh viên PTIT (ví dụ: B23DCCN085).');
      return;
    }
    if (!formData.email.trim()) {
      setError('Vui lòng nhập địa chỉ email sinh viên PTIT (@stu.ptit.edu.vn).');
      return;
    }
    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp với mật khẩu đã nhập.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        fullName: formData.fullName.trim(),
        studentCode: formData.studentCode.trim().toUpperCase(),
        universityId: 4, // Học viện PTIT
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      };

      const res = await authService.register(payload);
      const data = res?.data || res;

      setSuccess(true);

      // Đăng nhập tự động sau khi đăng ký thành công
      if (data?.token && data?.user) {
        setTimeout(() => {
          login(data.user, data.token);
          navigate('/dashboard');
        }, 1200);
      } else {
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      }
    } catch (err) {
      const apiMsg =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.[0]?.message ||
        err?.message ||
        'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.';
      setError(apiMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-8 px-4 bg-slate-50/50">
      <div className="max-w-xl w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-500 text-white flex items-center justify-center mx-auto shadow-md">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">
            Đăng Ký Tài Khoản Sinh Viên PTIT
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Nền tảng chia sẻ và trao đổi đồ dùng cũ dành riêng cho sinh viên Học viện Công nghệ Bưu chính Viễn thông
          </p>
        </div>

        {/* Feature highlight badge */}
        <div className="bg-rose-50/70 border border-rose-100 rounded-2xl p-3.5 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-[11px] text-rose-950 leading-relaxed">
            <strong className="font-bold text-rose-900">Quyền lợi sinh viên PTIT:</strong> Đăng bán giáo trình, kit thực hành vi điều khiển, đồ trọ KTX, nhắn tin trực tiếp với sinh viên cùng trường an toàn và tiện lợi.
          </div>
        </div>

        {/* Alert Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Alert Success */}
        {success && (
          <div className="flex items-center gap-2 p-3.5 text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-medium animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Đăng ký thành công! Đang tự động đăng nhập vào trang quản lý của bạn...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Họ và tên */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Họ và tên sinh viên *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Ví dụ: Đoàn Anh Quân"
                  className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-rose-500 transition-colors font-medium"
                />
              </div>
            </div>

            {/* Mã số sinh viên */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Mã sinh viên (MSSV) *
              </label>
              <div className="relative">
                <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="studentCode"
                  required
                  value={formData.studentCode}
                  onChange={handleChange}
                  placeholder="Ví dụ: B23DCCN085"
                  className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-rose-500 transition-colors font-medium uppercase"
                />
              </div>
            </div>
          </div>

          {/* Cố định trường PTIT */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Đơn vị đào tạo (Cố định trong phạm vi đồ án) *
            </label>
            <div className="flex items-center gap-3 p-3 bg-rose-50/60 border border-rose-200 rounded-xl">
              <div className="w-9 h-9 rounded-xl bg-rose-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
                PTIT
              </div>
              <div className="flex-1">
                <span className="font-bold text-xs text-rose-950 block">Học viện Công nghệ Bưu chính Viễn thông</span>
                <span className="text-[11px] text-rose-800">Km10 Đường Nguyễn Trãi, Q. Hà Đông, Hà Nội</span>
              </div>
              <span className="text-[10px] font-bold text-rose-700 bg-white px-2 py-0.5 rounded border border-rose-200">
                PTIT Scope
              </span>
            </div>
          </div>

          {/* Email sinh viên PTIT */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Email sinh viên PTIT *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="Ví dụ: quan.da23@stu.ptit.edu.vn"
                className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-rose-500 transition-colors font-medium"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Khuyến nghị dùng email sinh viên có đuôi <span className="font-mono text-rose-600 font-semibold">@stu.ptit.edu.vn</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mật khẩu */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Mật khẩu *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Ít nhất 6 ký tự"
                  className="w-full text-xs pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-rose-500 transition-colors font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Nhập lại mật khẩu */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nhập lại mật khẩu *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Nhập lại chính xác"
                  className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-rose-500 transition-colors font-medium"
                />
              </div>
            </div>
          </div>

          {/* Nút Đăng ký */}
          <button
            type="submit"
            disabled={loading || success}
            className="w-full text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 mt-2"
          >
            {loading ? 'Đang tạo tài khoản sinh viên PTIT...' : 'Tạo Tài Khoản Sinh Viên PTIT'}
          </button>
        </form>

        {/* Chuyển tới Đăng nhập */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-slate-500">
            Bạn đã có tài khoản rồi?{' '}
            <Link
              to="/login"
              className="text-rose-600 font-bold hover:underline"
            >
              Đăng nhập ngay
            </Link>
          </span>

          <Link
            to="/"
            className="inline-flex items-center text-slate-400 hover:text-rose-600 transition-colors gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Chợ đồ cũ PTIT
          </Link>
        </div>
      </div>
    </div>
  );
}
