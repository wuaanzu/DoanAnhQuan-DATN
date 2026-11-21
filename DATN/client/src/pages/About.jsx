import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  MapPin,
  Repeat,
  Gift,
  HeartHandshake,
  Users,
  Code2,
  GraduationCap,
  User,
  ArrowRight,
  CheckCircle2,
  MessageCircle,
  HelpCircle,
  Leaf,
  Layers,
  Send,
  Building,
} from 'lucide-react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';

export default function About() {
  const steps = [
    {
      step: '01',
      title: 'Đăng tin trong 30 giây',
      desc: 'Chụp ảnh món đồ, chọn tình trạng (Mới 99%, Còn tốt...) và thiết lập giá bán lại rẻ, trao đổi môn học hoặc tặng miễn phí 0đ.',
      icon: Sparkles,
      color: 'bg-rose-50 text-rose-600 border-rose-200',
    },
    {
      step: '02',
      title: 'Nhắn tin & Thoả thuận',
      desc: 'Người mua và người bán kết nối trực tiếp thông qua hệ thống tin nhắn nội bộ của UniShare, bảo mật số điện thoại cá nhân.',
      icon: MessageCircle,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    {
      step: '03',
      title: 'Hẹn gặp tại khuôn viên PTIT',
      desc: 'Chọn địa điểm quen thuộc trong học viện như Giảng đường A2, Giảng đường A3, Thư viện A1 hoặc KTX B1/B4 để kiểm tra đồ tận tay.',
      icon: MapPin,
      color: 'bg-amber-50 text-amber-600 border-amber-200',
    },
    {
      step: '04',
      title: 'Hoàn tất & Tiết kiệm',
      desc: 'Nhận đồ trực tiếp không tốn 1 đồng phí vận chuyển, chia sẻ giá trị cho bạn bè cùng trường và cùng lan tỏa lối sống xanh.',
      icon: HeartHandshake,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
  ];

  const values = [
    {
      title: '100% Sinh Viên PTIT Xác Thực',
      desc: 'Tất cả tài khoản đều liên kết với email sinh viên @stu.ptit.edu.vn và mã sinh viên chính chủ, loại bỏ rủi ro gian lận.',
      icon: ShieldCheck,
      color: 'bg-rose-600 text-white',
    },
    {
      title: 'Giao Dịch Trực Tiếp - 0đ Phí Ship',
      desc: 'Giao nhận ngay trong khuôn viên trường: Giảng đường A2, A3, Thư viện A1, Ký túc xá. Kiểm tra đồ thật kỹ trước khi nhận.',
      icon: MapPin,
      color: 'bg-amber-500 text-white',
    },
    {
      title: 'Văn Hóa Tặng Đồ & Trao Đổi 0đ',
      desc: 'Khuyến khích sinh viên khóa trên tặng lại giáo trình, đồng phục, tài liệu ôn thi cho tân sinh viên khóa mới.',
      icon: Gift,
      color: 'bg-purple-600 text-white',
    },
    {
      title: 'Kinh Tế Tuần Hoàn & Lối Sống Xanh',
      desc: 'Tái sử dụng các món đồ còn giá trị, giảm thiểu lãng phí đồ nhựa và rác thải điện tử trong môi trường giảng đường.',
      icon: Leaf,
      color: 'bg-emerald-600 text-white',
    },
  ];

  const techStack = [
    { name: 'React 19 & Vite 8', role: 'Giao diện Single Page Application mượt mà, phản hồi tức thì' },
    { name: 'Tailwind CSS v4', role: 'CSS-first framework styling hiện đại, responsive đa thiết bị' },
    { name: 'Node.js & Express', role: 'RESTful API xử lý nghiệp vụ xác thực & danh mục sản phẩm' },
    { name: 'Microsoft SQL Server', role: 'Cơ sở dữ liệu quan hệ (UniShareDB) lưu trữ an toàn' },
    { name: 'Socket.IO', role: 'Truyền thông điệp & nhắn tin trực tiếp thời gian thực' },
    { name: 'JWT & Bcrypt', role: 'Xác thực phân quyền và mã hóa bảo mật mật khẩu sinh viên' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-16">
      {/* HERO BANNER GIỚI THIỆU */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-rose-950 to-slate-900 text-white p-8 sm:p-12 shadow-xl border border-rose-900/40">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#f43f5e_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="relative space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-xs font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-rose-300" />
            Về Chúng Tôi • UniShare PTIT
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
            Nền Tảng Chia Sẻ & Trao Đổi Đồ Cũ <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-300 via-amber-200 to-rose-200">
              Sinh Viên Học Viện PTIT
            </span>
          </h1>

          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            UniShare PTIT được xây dựng nhằm mang đến một không gian thương mại sinh viên C2C văn minh, an toàn và hoàn toàn miễn phí. Nơi sinh viên Học viện Công nghệ Bưu chính Viễn thông có thể sang nhượng lại giáo trình, kit thực hành, đồ dùng KTX còn giá trị sử dụng cho nhau một cách dễ dàng nhất.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <Link to="/">
              <Button size="md" className="bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md">
                Khám phá Chợ đồ cũ PTIT
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button size="md" variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20 font-semibold backdrop-blur-xs">
                Đăng tin trao đổi ngay
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* SỨ MỆNH & CÂU CHUYỆN RA ĐỜI */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200 inline-block">
            Sứ Mệnh Của Chúng Tôi
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-snug">
            Giúp sinh viên tiết kiệm chi phí, kết nối văn minh và giảm lãng phí đồ dùng
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Mỗi mùa thi hay kết thúc học kỳ, sinh viên PTIT thường dư thừa nhiều giáo trình chuyên ngành (Cấu trúc dữ liệu, Mạng máy tính, An toàn thông tin, Vi xử lý), máy tính Casio, kit vi điều khiển thực hành và đồ gia dụng phòng trọ KTX. Đa phần các món đồ này vẫn còn mới và sử dụng rất tốt nhưng chưa có kênh kết nối thuận tiện.
          </p>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            UniShare PTIT ra đời để giải quyết trực tiếp bài toán này: tạo cầu nối giữa các thế hệ sinh viên khóa D21, D22, D23, D24... sang nhượng lại với giá sinh viên, trao đổi môn học hoặc tặng miễn phí 0đ cho tân sinh viên mới nhập học.
          </p>
        </div>

        <div className="bg-gradient-to-tr from-rose-50 via-white to-amber-50 p-6 sm:p-8 rounded-3xl border border-rose-100 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building className="w-5 h-5 text-rose-600" />
            Khu Vực Phục Vụ Trực Tiếp Tại PTIT
          </h3>
          <p className="text-xs text-slate-600">
            Hệ thống hỗ trợ lọc và gợi ý các địa điểm hẹn gặp giao dịch an toàn ngay trong khuôn viên:
          </p>
          <ul className="space-y-2 text-xs text-slate-700">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span><strong>Giảng đường A2:</strong> Khu vực sảnh tầng 1 & hành lang trung tâm.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span><strong>Giảng đường A3:</strong> Cạnh sân bóng & phòng Lab Viễn thông.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span><strong>Nhà A1 & Thư viện PTIT:</strong> Tầng 2, không gian học tập yên tĩnh.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span><strong>Ký túc xá B1 & B4:</strong> Thuận tiện cho sinh viên nội trú.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span><strong>Khu trọ sinh viên:</strong> Ngõ Ao Sen (đối diện trường) & Triều Khúc.</span>
            </li>
          </ul>
        </div>
      </section>

      {/* 4 GIÁ TRỊ NỔI BẬT */}
      <section className="space-y-6">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Lợi Ích Thực Tế</span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Tại Sao Chọn UniShare PTIT?</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Trải nghiệm mua bán và trao đổi đồ dùng được thiết kế chuẩn xác theo nhu cầu sinh viên học viện.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {values.map((v, i) => {
            const Icon = v.icon;
            return (
              <div
                key={i}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-xs ${v.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">{v.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{v.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* QUY TRÌNH 4 BƯỚC ĐƠN GIẢN */}
      <section className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 space-y-8 relative overflow-hidden">
        <div className="space-y-2 max-w-xl">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Cách Thức Hoạt Động</span>
          <h2 className="text-2xl sm:text-3xl font-black">Quy Trình Trao Đổi 4 Bước</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Nhanh chóng, minh bạch và an toàn tuyệt đối ngay tại trường học.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div key={idx} className="space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-rose-400/80 font-mono">{s.step}</span>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${s.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <h4 className="font-bold text-base text-white">{s.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* THÔNG TIN PHÁT TRIỂN & ĐỒ ÁN (GIỮ LẠI THÔNG TIN CẦN THIẾT) */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md">
              Đội Ngũ Phát Triển & Công Nghệ
            </span>
            <h3 className="text-xl font-black text-slate-900 mt-2">
              Thông Tin Dự Án Nghiên Cứu & Phát Triển
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Khoa Công Nghệ Thông Tin • Học viện PTIT
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center gap-2 text-rose-600 mb-1">
              <User className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Tác giả & Phát triển</span>
            </div>
            <p className="text-base font-bold text-slate-900">Đoàn Anh Quân</p>
            <p className="text-xs text-slate-600">Mã SV: <strong>2310900085</strong> • Lớp: <strong>K23CNT1</strong></p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <GraduationCap className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Đơn vị đào tạo</span>
            </div>
            <p className="text-base font-bold text-slate-900">Học viện Công nghệ Bưu chính Viễn thông</p>
            <p className="text-xs text-slate-600">Khoa Công Nghệ Thông Tin (PTIT - 2026)</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center gap-2 text-emerald-600 mb-1">
              <Send className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Hỗ trợ & Liên hệ</span>
            </div>
            <p className="text-base font-bold text-slate-900">unishare@stu.ptit.edu.vn</p>
            <p className="text-xs text-slate-600">Km10 Đường Nguyễn Trãi, Q. Hà Đông, Hà Nội</p>
          </div>
        </div>

        {/* Nền tảng công nghệ áp dụng */}
        <div className="pt-2 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Code2 className="w-4 h-4" /> Kiến trúc công nghệ hiện đại áp dụng
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {techStack.map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                <span className="font-bold text-xs text-slate-900">{item.name}</span>
                <span className="text-[11px] text-slate-500 mt-1">{item.role}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BANNER KÊU GỌI HÀNH ĐỘNG CUỐI TRANG */}
      <section className="bg-gradient-to-r from-rose-600 to-red-600 text-white rounded-3xl p-8 sm:p-10 text-center space-y-4 shadow-lg">
        <h3 className="text-2xl sm:text-3xl font-black">
          Cùng Xây Dựng Cộng Đồng Sinh Viên PTIT Văn Minh!
        </h3>
        <p className="text-xs sm:text-sm text-rose-100 max-w-xl mx-auto leading-relaxed">
          Đăng ký tài khoản ngay hôm nay bằng email sinh viên PTIT để đăng bán món đồ không dùng tới hoặc tìm kiếm những cuốn giáo trình hữu ích cho kỳ học mới.
        </p>
        <div className="pt-2 flex flex-wrap justify-center gap-3">
          <Link to="/register">
            <button className="bg-white text-rose-700 hover:bg-rose-50 font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-md">
              Tạo tài khoản sinh viên PTIT
            </button>
          </Link>
          <Link to="/">
            <button className="bg-rose-800/60 hover:bg-rose-800 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-all border border-rose-400/40">
              Xem chợ đồ cũ PTIT
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
