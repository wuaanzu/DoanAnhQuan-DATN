import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Tag,
  ArrowRight,
  Sparkles,
  Heart,
  Eye,
  ShieldCheck,
  Repeat,
  Gift,
  BookOpen,
  Laptop,
  Shirt,
  CookingPot,
  PencilRuler,
  Package,
  CheckCircle2,
  Clock,
  User,
  X,
  Phone,
  MessageCircle,
  SlidersHorizontal,
  ArrowUpDown,
  LayoutGrid,
  List,
  Check,
  Share2,
  AlertCircle,
  Zap,
} from 'lucide-react';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import { productService } from '@/services/productService';
import { TRANSACTION_TYPES, CONDITIONS } from '@/utils/constants';
import heroImg from '@/assets/hero-unishare.png';

const PTIT_LOCATIONS = [
  { value: '', label: 'Tất cả địa điểm tại PTIT' },
  { value: 'A2', label: 'Giảng đường A2 (Km10 Nguyễn Trãi)' },
  { value: 'A3', label: 'Giảng đường A3 (Cạnh sân bóng)' },
  { value: 'Thư viện', label: 'Thư viện PTIT (Tầng 2 - Nhà A1)' },
  { value: 'Ký túc xá B4', label: 'Ký túc xá B4 PTIT Hà Đông' },
  { value: 'Ký túc xá B1', label: 'Ký túc xá B1 PTIT Hà Đông' },
  { value: 'Căng tin', label: 'Căng tin & Sân bóng PTIT' },
  { value: 'Ao Sen', label: 'Khu trọ Ao Sen (Đối diện PTIT)' },
  { value: 'Triều Khúc', label: 'Khu trọ Triều Khúc (Gần PTIT)' },
  { value: 'Cổng trường', label: 'Cổng trường Km10 Nguyễn Trãi' },
  { value: 'Hoàng Quốc Việt', label: 'Cơ sở Hoàng Quốc Việt' },
];

const POPULAR_TAGS = [
  'Cấu trúc dữ liệu PTIT',
  'Kit STM32F4',
  'Arduino Uno',
  'Casio 580VN',
  'Áo khoác PTIT',
  'Bàn học KTX',
  'Nồi cơm điện',
];

export default function Home() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedCondition, setSelectedCondition] = useState('ALL');
  const [priceRange, setPriceRange] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalProduct, setActiveModalProduct] = useState(null);

  // Yêu thích (Wishlist) lưu localStorage
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('unishare_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Toast thông báo tương tác
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 2500);
  };

  const toggleFavorite = (e, productId) => {
    e.stopPropagation();
    let updated;
    if (favorites.includes(productId)) {
      updated = favorites.filter((id) => id !== productId);
      showToast('Đã xóa món đồ khỏi danh sách yêu thích');
    } else {
      updated = [...favorites, productId];
      showToast('❤️ Đã lưu món đồ vào danh sách yêu thích!');
    }
    setFavorites(updated);
    try {
      localStorage.setItem('unishare_favorites', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Fallback demo data chuẩn sinh viên PTIT
  const fallbackProducts = [
    {
      productId: 16,
      title: 'Giáo trình Cấu trúc dữ liệu và giải thuật - PTIT',
      price: 25000,
      condition: 'Good',
      transactionType: 'Sell',
      location: 'Giảng đường A2 - PTIT, Km10 Nguyễn Trãi',
      sellerName: 'Đoàn Anh Quân',
      universityShortName: 'PTIT',
      categoryName: 'Giáo trình',
      viewCount: 85,
      imageUrl: '/uploads/seed/p01.png',
    },
    {
      productId: 15,
      title: 'Kit thực hành vi điều khiển STM32F401 + Mạch nạp ST-Link',
      price: 250000,
      condition: 'New',
      transactionType: 'Sell',
      location: 'Phòng Lab Viễn thông - Nhà A3 PTIT',
      sellerName: 'Nguyễn Minh Anh',
      universityShortName: 'PTIT',
      categoryName: 'Đồ điện tử',
      viewCount: 64,
      imageUrl: '/uploads/seed/p03.png',
    },
    {
      productId: 18,
      title: 'Áo khoác gió đồng phục PTIT màu đỏ mận size L',
      price: 0,
      condition: 'Good',
      transactionType: 'Free',
      location: 'Căng tin PTIT - Cạnh sân bóng',
      sellerName: 'Trần Thu Hà',
      universityShortName: 'PTIT',
      categoryName: 'Quần áo',
      viewCount: 92,
      imageUrl: '/uploads/seed/p05.png',
    },
    {
      productId: 17,
      title: 'Board Arduino Uno R3 + Bộ cảm biến thực hành IoT PTIT',
      price: 160000,
      condition: 'New',
      transactionType: 'Sell',
      location: 'Ký túc xá B4 PTIT - Cơ sở Hà Đông',
      sellerName: 'Đoàn Anh Quân',
      universityShortName: 'PTIT',
      categoryName: 'Đồ điện tử',
      viewCount: 48,
      imageUrl: '/uploads/seed/p04.png',
    },
    {
      productId: 7,
      title: 'Máy tính Casio FX-580VN X dán sticker PTIT IT',
      price: 350000,
      condition: 'Good',
      transactionType: 'Sell',
      location: 'Giảng đường A2 - Km10 Nguyễn Trãi',
      sellerName: 'Phạm Gia Bảo',
      universityShortName: 'PTIT',
      categoryName: 'Đồ dùng học tập',
      viewCount: 84,
      imageUrl: '/uploads/seed/p07.png',
    },
    {
      productId: 19,
      title: 'Sách Kiến trúc máy tính & Hợp ngữ Assembly (PTIT)',
      price: 0,
      condition: 'Good',
      transactionType: 'Exchange',
      desiredExchange: 'Đổi lấy giáo trình Hệ điều hành hoặc Mạng máy tính PTIT',
      location: 'Thư viện PTIT tầng 2 - Nhà A1',
      sellerName: 'Phạm Gia Bảo',
      universityShortName: 'PTIT',
      categoryName: 'Giáo trình',
      viewCount: 53,
      imageUrl: '/uploads/seed/p02.png',
    },
    {
      productId: 1017,
      title: 'Bàn phím cơ Akko 3087 switch Orange gõ code PTIT',
      price: 480000,
      condition: 'Good',
      transactionType: 'Sell',
      location: 'Cổng trường PTIT - Km10 Nguyễn Trãi',
      sellerName: 'Đoàn Anh Quân',
      universityShortName: 'PTIT',
      categoryName: 'Đồ điện tử',
      viewCount: 76,
      imageUrl: '/uploads/seed/p13.png',
    },
    {
      productId: 1021,
      title: 'Nồi cơm điện Sunhouse 1.2L cho sinh viên trọ Triều Khúc',
      price: 140000,
      condition: 'Good',
      transactionType: 'Sell',
      location: 'Ngõ 66 Triều Khúc (cách PTIT 400m)',
      sellerName: 'Trần Thu Hà',
      universityShortName: 'PTIT',
      categoryName: 'Đồ gia dụng',
      viewCount: 43,
      imageUrl: '/uploads/seed/p06.png',
    },
  ];

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const catRes = await productService.getCategories();
        setCategories(catRes || []);

        const prodRes = await productService.getProducts({ limit: 40 });
        const list = prodRes.data?.length
          ? prodRes.data
          : Array.isArray(prodRes) && prodRes.length
          ? prodRes
          : fallbackProducts;
        setProducts(list);
      } catch (err) {
        console.warn('Lấy dữ liệu API không thành công, dùng demo PTIT:', err);
        setProducts(fallbackProducts);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getCategoryIcon = (name) => {
    switch (name) {
      case 'Sách':
      case 'Giáo trình':
        return <BookOpen className="w-5 h-5" />;
      case 'Đồ điện tử':
        return <Laptop className="w-5 h-5" />;
      case 'Quần áo':
        return <Shirt className="w-5 h-5" />;
      case 'Đồ gia dụng':
        return <CookingPot className="w-5 h-5" />;
      case 'Đồ dùng học tập':
        return <PencilRuler className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  // Lọc sản phẩm đa tiêu chí
  const filteredProducts = products
    .filter((item) => {
      // Danh mục
      const matchCat =
        !selectedCategory ||
        item.categoryId === selectedCategory ||
        item.categoryName === selectedCategory;

      // Địa điểm
      const matchLoc =
        !selectedLocation ||
        item.location?.toLowerCase().includes(selectedLocation.toLowerCase());

      // Loại giao dịch
      const matchType = selectedType === 'ALL' || item.transactionType === selectedType;

      // Tình trạng
      const matchCond = selectedCondition === 'ALL' || item.condition === selectedCondition;

      // Mức giá
      let matchPrice = true;
      const numPrice = Number(item.price || 0);
      if (priceRange === 'free') matchPrice = numPrice === 0 || item.transactionType === 'Free';
      else if (priceRange === 'under50') matchPrice = numPrice > 0 && numPrice <= 50000;
      else if (priceRange === '50to200') matchPrice = numPrice > 50000 && numPrice <= 200000;
      else if (priceRange === '200to500') matchPrice = numPrice > 200000 && numPrice <= 500000;
      else if (priceRange === 'over500') matchPrice = numPrice > 500000;

      // Từ khóa tìm kiếm
      const matchQuery =
        !searchQuery ||
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sellerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchCat && matchLoc && matchType && matchCond && matchPrice && matchQuery;
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc') return Number(a.price || 0) - Number(b.price || 0);
      if (sortBy === 'price_desc') return Number(b.price || 0) - Number(a.price || 0);
      if (sortBy === 'popular') return (b.viewCount || 0) - (a.viewCount || 0);
      // Mặc định: newest
      return (b.productId || 0) - (a.productId || 0);
    });

  const formatPrice = (price, type) => {
    if (type === 'Free' || Number(price) === 0) {
      return (
        <span className="text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-lg font-black text-sm">
          Miễn phí (0đ)
        </span>
      );
    }
    if (type === 'Exchange') {
      return (
        <span className="text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg font-black text-sm">
          Trao đổi đồ
        </span>
      );
    }
    return (
      <span className="text-rose-700 font-black text-base md:text-lg">
        {Number(price).toLocaleString('vi-VN')} <span className="text-xs font-semibold">₫</span>
      </span>
    );
  };

  const hasActiveFilters =
    selectedCategory ||
    selectedLocation ||
    selectedType !== 'ALL' ||
    selectedCondition !== 'ALL' ||
    priceRange !== 'ALL' ||
    searchQuery;

  const resetAllFilters = () => {
    setSelectedCategory(null);
    setSelectedLocation('');
    setSelectedType('ALL');
    setSelectedCondition('ALL');
    setPriceRange('ALL');
    setSearchQuery('');
    setSortBy('newest');
  };

  return (
    <div className="space-y-10 pb-16">
      {/* TOAST THÔNG BÁO TƯƠNG TÁC */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* HERO BANNER PTIT PREMIUM */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-rose-950 to-slate-950 text-white shadow-2xl border border-rose-900/40">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#f43f5e_1px,transparent_1px)] [background-size:20px_20px]"></div>
        
        {/* Glow orb */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-rose-600/20 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-amber-500/15 blur-3xl pointer-events-none"></div>

        <div className="relative max-w-6xl mx-auto px-6 py-12 md:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-xs font-bold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-rose-300" />
              Chợ Đồ Cũ Sinh Viên Học Viện PTIT
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.15]">
              Trao đổi & Mua bán đồ cũ <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-300 via-amber-200 to-rose-200">
                ngay trong Học viện PTIT
              </span>
            </h1>

            <p className="text-slate-300 text-sm md:text-base max-w-xl leading-relaxed">
              Nền tảng chính chủ dành cho sinh viên Học viện Công nghệ Bưu chính Viễn thông. Mua bán giáo trình IT, ĐTVT, kit vi điều khiển, đồ trọ KTX, thiết bị học tập với giá siêu tiết kiệm.
            </p>

            {/* THANH TÌM KIẾM HERO HIỆN ĐẠI */}
            <div className="bg-white p-2 rounded-2xl shadow-xl text-slate-800 flex flex-col md:flex-row gap-2 border border-slate-100">
              <div className="flex-1 flex items-center px-3 gap-2.5 border-b md:border-b-0 md:border-r border-slate-200 py-2.5 md:py-0">
                <Search className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Tìm giáo trình C++, kit STM32, Casio 580VN, áo khoác..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs md:text-sm bg-transparent outline-none placeholder:text-slate-400 font-medium"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Lọc theo khu vực PTIT */}
              <div className="flex items-center px-3 gap-2 py-2 md:py-0">
                <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="text-xs md:text-sm bg-transparent outline-none text-slate-700 cursor-pointer font-medium max-w-[190px] truncate"
                >
                  {PTIT_LOCATIONS.map((loc) => (
                    <option key={loc.value} value={loc.value}>
                      {loc.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {}}
                className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white px-6 py-3 rounded-xl font-bold text-xs md:text-sm transition-all shadow-md shrink-0 flex items-center justify-center gap-1.5"
              >
                <Search className="w-4 h-4" />
                Tìm kiếm
              </button>
            </div>

            {/* TAGS GỢI Ý TÌM KIẾM NHANH */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" /> Tìm nhiều:
              </span>
              {POPULAR_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSearchQuery(tag)}
                  className="text-[11px] bg-white/10 hover:bg-white/20 text-slate-200 px-2.5 py-1 rounded-lg backdrop-blur-xs transition-colors border border-white/10 font-medium"
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* TRUST TICKER */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-slate-300 text-[11px]">100% SV PTIT xác thực</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="text-slate-300 text-[11px]">Hẹn tại A2, A3, KTX</span>
              </div>
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="text-slate-300 text-[11px]">Tặng đồ 0đ & Trao đổi</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span className="text-slate-300 text-[11px]">0đ Phí ship & Trung gian</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 hidden lg:flex justify-center items-center">
            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-r from-rose-500 to-amber-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <img
                src={heroImg}
                alt="UniShare PTIT - Trao đổi đồ cũ sinh viên"
                className="relative rounded-3xl shadow-2xl object-cover max-h-[380px] border border-white/15 group-hover:scale-[1.02] transition-transform duration-300"
              />
              <div className="absolute bottom-4 left-4 right-4 bg-slate-900/85 backdrop-blur-md p-3 rounded-2xl border border-white/15 flex items-center justify-between text-xs">
                <div>
                  <span className="text-rose-400 font-bold block text-[11px]">Học viện Công nghệ Bưu chính Viễn thông</span>
                  <span className="text-slate-300 text-[10px]">Km10 Nguyễn Trãi, Q. Hà Đông, Hà Nội</span>
                </div>
                <span className="bg-emerald-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                  Hoạt động
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DANH MỤC PHỔ BIẾN */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900">Danh Mục Đồ Dùng PTIT</h2>
            <p className="text-xs md:text-sm text-slate-500">Khám phá các nhóm đồ dùng học tập và đời sống sinh viên học viện</p>
          </div>
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-xs text-rose-600 font-bold hover:underline flex items-center gap-1"
            >
              Xem tất cả danh mục
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.categoryId || selectedCategory === cat.categoryName;
            return (
              <button
                key={cat.categoryId}
                onClick={() => setSelectedCategory(isSelected ? null : cat.categoryId)}
                className={`p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between gap-3 group cursor-pointer ${
                  isSelected
                    ? 'border-rose-500 bg-rose-50/80 text-rose-900 shadow-sm ring-2 ring-rose-200'
                    : 'border-slate-200 bg-white hover:border-rose-300 hover:shadow-sm'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-100 text-slate-700 group-hover:bg-rose-100 group-hover:text-rose-700'
                  }`}
                >
                  {getCategoryIcon(cat.categoryName)}
                </div>
                <span className="text-xs md:text-sm font-bold truncate w-full">{cat.categoryName}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* TOOLBAR BỘ LỌC VÀ DANH SÁCH MÓN ĐỒ */}
      <section className="space-y-5">
        {/* THANH ĐIỀU KHIỂN & BỘ LỌC TOÀN DIỆN */}
        <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* TABS HÌNH THỨC GIAO DỊCH */}
            <div className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-2xl self-start overflow-x-auto max-w-full">
              <button
                onClick={() => setSelectedType('ALL')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  selectedType === 'ALL'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất cả ({filteredProducts.length})
              </button>
              <button
                onClick={() => setSelectedType('Sell')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                  selectedType === 'Sell'
                    ? 'bg-white text-rose-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Tag className="w-3.5 h-3.5" /> Bán lại
              </button>
              <button
                onClick={() => setSelectedType('Exchange')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                  selectedType === 'Exchange'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Repeat className="w-3.5 h-3.5" /> Trao đổi
              </button>
              <button
                onClick={() => setSelectedType('Free')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                  selectedType === 'Free'
                    ? 'bg-white text-purple-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Gift className="w-3.5 h-3.5" /> Tặng 0đ
              </button>
            </div>

            {/* SẮP XẾP & VIEW MODE */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Sắp xếp */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-700">Sắp xếp:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-2.5 py-1.5 outline-none font-semibold focus:border-rose-500 cursor-pointer"
                >
                  <option value="newest">Mới đăng gần đây</option>
                  <option value="price_asc">Giá: Thấp đến cao</option>
                  <option value="price_desc">Giá: Cao đến thấp</option>
                  <option value="popular">Xem nhiều nhất</option>
                </select>
              </div>

              {/* Chế độ xem Lưới / Danh sách */}
              <div className="flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400 hover:text-slate-700'
                  }`}
                  title="Xem dạng lưới"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400 hover:text-slate-700'
                  }`}
                  title="Xem dạng danh sách"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* HÀNG BỘ LỌC PHỤ: MỨC GIÁ & TÌNH TRẠNG */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
            {/* Lọc theo mức giá */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-slate-400 font-medium mr-1">Mức giá:</span>
              {[
                { key: 'ALL', label: 'Tất cả' },
                { key: 'free', label: '0đ (Miễn phí)' },
                { key: 'under50', label: '< 50k' },
                { key: '50to200', label: '50k - 200k' },
                { key: '200to500', label: '200k - 500k' },
                { key: 'over500', label: '> 500k' },
              ].map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPriceRange(p.key)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    priceRange === p.key
                      ? 'bg-rose-100 text-rose-800 font-bold border border-rose-200'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Nút đặt lại khi có bộ lọc */}
            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                className="text-xs text-rose-600 font-bold hover:underline flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        {/* DANH SÁCH SẢN PHẨM */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-slate-500 font-medium">Đang tải danh sách đồ cũ sinh viên PTIT...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-4 p-8">
            <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
              <Package className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Không tìm thấy món đồ phù hợp tại PTIT</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Hãy thử xóa bộ lọc hoặc tìm kiếm bằng từ khóa ngắn gọn hơn như "giáo trình", "kit", "máy tính".
              </p>
            </div>
            <button
              onClick={resetAllFilters}
              className="text-xs font-bold text-rose-600 bg-rose-50 px-4 py-2 rounded-xl hover:bg-rose-100 transition-colors inline-block"
            >
              Đặt lại tất cả bộ lọc
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* CHẾ ĐỘ XEM GRID (LƯỚI) */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredProducts.map((item) => {
              const typeCfg = TRANSACTION_TYPES[item.transactionType] || TRANSACTION_TYPES.Sell;
              const condCfg = CONDITIONS[item.condition] || CONDITIONS.Good;
              const isFav = favorites.includes(item.productId);

              return (
                <div
                  key={item.productId}
                  onClick={() => setActiveModalProduct(item)}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden card-hover-effect flex flex-col cursor-pointer group relative"
                >
                  {/* Ảnh sản phẩm */}
                  <div className="relative aspect-4/3 bg-slate-100 overflow-hidden flex items-center justify-center">
                    {item.imageUrl ? (
                      <img
                        src={`http://localhost:5000${item.imageUrl}`}
                        alt={item.title}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = heroImg;
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                        <Package className="w-10 h-10 mb-1 opacity-50" />
                        <span className="text-[11px]">Đồ dùng PTIT</span>
                      </div>
                    )}

                    {/* Badge loại giao dịch */}
                    <span
                      className={`absolute top-2.5 left-2.5 text-[11px] font-bold px-2 py-0.5 rounded-lg border shadow-xs ${typeCfg.color}`}
                    >
                      {typeCfg.label}
                    </span>

                    {/* Badge trường đại học PTIT */}
                    <span className="absolute top-2.5 right-2.5 text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-600 text-white shadow-xs">
                      PTIT
                    </span>

                    {/* Nút Yêu thích trên ảnh */}
                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(e, item.productId)}
                      className={`absolute bottom-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-xs ${
                        isFav
                          ? 'bg-rose-600 text-white'
                          : 'bg-white/80 hover:bg-white text-slate-600 hover:text-rose-600'
                      }`}
                      title={isFav ? 'Bỏ lưu' : 'Lưu tin yêu thích'}
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  {/* Thông tin món đồ */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                          {item.categoryName || 'Đồ sinh viên'}
                        </span>
                        <span className={`font-semibold ${condCfg.color}`}>{condCfg.label}</span>
                      </div>

                      <h3 className="font-bold text-slate-900 line-clamp-2 text-sm group-hover:text-rose-600 transition-colors pt-1">
                        {item.title}
                      </h3>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <div>{formatPrice(item.price, item.transactionType)}</div>
                        <div className="flex items-center text-[11px] text-slate-400 gap-1">
                          <Eye className="w-3.5 h-3.5" /> {item.viewCount || 1}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                        <span className="flex items-center gap-1.5 truncate max-w-[140px]">
                          <div className="w-4 h-4 rounded-full bg-rose-100 text-rose-700 font-bold text-[9px] flex items-center justify-center shrink-0">
                            {item.sellerName ? item.sellerName.charAt(0) : 'S'}
                          </div>
                          <span className="truncate text-[11px] font-medium text-slate-700">
                            {item.sellerName || 'SV PTIT'}
                          </span>
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-slate-400">
                          <MapPin className="w-3 h-3 text-rose-600 shrink-0" />
                          <span className="truncate max-w-[100px]">{item.location?.split('-')[0] || 'Khuôn viên PTIT'}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* CHẾ ĐỘ XEM LIST (DANH SÁCH CHI TIẾT) */
          <div className="space-y-3">
            {filteredProducts.map((item) => {
              const typeCfg = TRANSACTION_TYPES[item.transactionType] || TRANSACTION_TYPES.Sell;
              const condCfg = CONDITIONS[item.condition] || CONDITIONS.Good;
              const isFav = favorites.includes(item.productId);

              return (
                <div
                  key={item.productId}
                  onClick={() => setActiveModalProduct(item)}
                  className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 card-hover-effect flex flex-col sm:flex-row items-start sm:items-center gap-4 cursor-pointer group"
                >
                  {/* Ảnh nhỏ */}
                  <div className="w-full sm:w-36 h-28 bg-slate-100 rounded-xl overflow-hidden shrink-0 relative">
                    {item.imageUrl ? (
                      <img
                        src={`http://localhost:5000${item.imageUrl}`}
                        alt={item.title}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = heroImg;
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Package className="w-8 h-8 opacity-50" />
                      </div>
                    )}
                    <span className="absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-600 text-white">
                      PTIT
                    </span>
                  </div>

                  {/* Nội dung */}
                  <div className="flex-1 space-y-1.5 w-full">
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeCfg.color}`}>
                        {typeCfg.label}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-xs font-semibold text-slate-600">{item.categoryName}</span>
                      <span className="text-slate-400">•</span>
                      <span className={`text-xs font-medium ${condCfg.color}`}>{condCfg.label}</span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm md:text-base group-hover:text-rose-600 transition-colors line-clamp-1">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-1">{item.description || item.location}</p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-slate-700 font-medium">{item.sellerName || 'SV PTIT'}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-600" />
                        <span>{item.location}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{item.viewCount || 1} lượt xem</span>
                      </span>
                    </div>
                  </div>

                  {/* Giá & Thao tác */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-right">{formatPrice(item.price, item.transactionType)}</div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(e, item.productId)}
                        className={`p-2 rounded-xl border transition-colors ${
                          isFav
                            ? 'bg-rose-50 border-rose-200 text-rose-600'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-rose-600'
                        }`}
                        title="Yêu thích"
                      >
                        <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        type="button"
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors"
                      >
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* CAM KẾT VĂN MINH TRAO ĐỔI SINH VIÊN PTIT */}
      <section className="bg-gradient-to-r from-rose-50 via-amber-50 to-emerald-50 rounded-3xl p-6 sm:p-8 border border-rose-100 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900 text-base">100% Sinh Viên PTIT Xác Thực</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mọi tài khoản đều liên kết với email sinh viên <code className="text-rose-700 font-bold">@stu.ptit.edu.vn</code> và mã sinh viên chính chủ, loại trừ lừa đảo.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
            <MapPin className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900 text-base">Gặp Mặt Trực Tiếp Tại Trường</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Hẹn gặp trao đổi ngay tại Giảng đường A2, A3, Thư viện A1 hoặc KTX B1/B4. Kiểm tra đồ tận tay, 0đ tiền ship.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <Repeat className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900 text-base">Kinh Tế Tuần Hoàn & Tiết Kiệm</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tái sử dụng giáo trình và linh kiện học tập cho các khóa D22, D23, D24 tiếp nối, bảo vệ môi trường học đường.
            </p>
          </div>
        </div>
      </section>

      {/* MODAL CHI TIẾT SẢN PHẨM HIỆN ĐẠI (CHUẨN ACCESSIBLE DIALOG) */}
      {activeModalProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
          onClick={() => setActiveModalProduct(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 space-y-6 relative shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveModalProduct(null)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              title="Đóng (Esc)"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Ảnh */}
              <div className="aspect-square bg-slate-100 rounded-2xl overflow-hidden flex items-center justify-center relative shadow-inner">
                {activeModalProduct.imageUrl ? (
                  <img
                    src={`http://localhost:5000${activeModalProduct.imageUrl}`}
                    alt={activeModalProduct.title}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = heroImg;
                    }}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="w-16 h-16 text-slate-400 opacity-60" />
                )}
                <span className="absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-full bg-white/95 shadow-md text-slate-800">
                  {TRANSACTION_TYPES[activeModalProduct.transactionType]?.label || 'Bán lại'}
                </span>
                <span className="absolute top-3 right-3 text-xs font-black px-2.5 py-1 rounded-full bg-rose-600 text-white shadow-md">
                  PTIT
                </span>
              </div>

              {/* Thông tin chi tiết */}
              <div className="flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-rose-600 uppercase tracking-wider bg-rose-50 px-2 py-0.5 rounded">
                      {activeModalProduct.categoryName}
                    </span>
                    <span className="text-xs font-semibold text-slate-600">
                      • {CONDITIONS[activeModalProduct.condition]?.label || 'Tốt'}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-slate-900 leading-snug">
                    {activeModalProduct.title}
                  </h3>

                  <div className="pt-1">
                    {formatPrice(activeModalProduct.price, activeModalProduct.transactionType)}
                  </div>

                  {activeModalProduct.desiredExchange && (
                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 leading-relaxed">
                      <strong className="block text-blue-800 mb-0.5">🔄 Nhu cầu trao đổi:</strong>
                      {activeModalProduct.desiredExchange}
                    </div>
                  )}

                  <p className="text-xs text-slate-600 pt-2 leading-relaxed">
                    {activeModalProduct.description ||
                      'Món đồ còn sử dụng rất tốt, phù hợp cho các bạn sinh viên cần tiết kiệm chi phí trong học tập và sinh hoạt.'}
                  </p>
                </div>

                {/* Hộp thông tin người bán uy tín */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-rose-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
                        {activeModalProduct.sellerName ? activeModalProduct.sellerName.charAt(0) : 'S'}
                      </div>
                      <div>
                        <h5 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                          {activeModalProduct.sellerName || 'Sinh viên PTIT'}
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" title="Đã xác thực PTIT" />
                        </h5>
                        <p className="text-[11px] text-rose-700 font-semibold">
                          Học viện Công nghệ Bưu chính Viễn thông
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Độ uy tín</span>
                      <span className="text-xs font-black text-amber-600">⭐ 4.9/5</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>
                      Hẹn giao dịch: <strong>{activeModalProduct.location || 'Khuôn viên PTIT'}</strong>
                    </span>
                  </div>

                  {/* Nút hành động */}
                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      onClick={() => {
                        const targetId = activeModalProduct.productId === 11 ? 1 : activeModalProduct.productId === 2 ? 2 : 3;
                        setActiveModalProduct(null);
                        navigate(`/messages?id=${targetId}`);
                      }}
                      className="w-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-bold py-3 rounded-xl text-xs md:text-sm transition-all flex items-center justify-center gap-2 shadow-md"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Nhắn tin trao đổi với người bán
                    </button>

                    <div className="flex gap-2">
                      <button
                        onClick={(e) => toggleFavorite(e, activeModalProduct.productId)}
                        className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                          favorites.includes(activeModalProduct.productId)
                            ? 'bg-rose-50 border-rose-200 text-rose-600'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${
                            favorites.includes(activeModalProduct.productId) ? 'fill-current' : ''
                          }`}
                        />
                        {favorites.includes(activeModalProduct.productId) ? 'Đã lưu yêu thích' : 'Lưu tin này'}
                      </button>

                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(window.location.href);
                          showToast('🔗 Đã sao chép liên kết món đồ!');
                        }}
                        className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5"
                        title="Chia sẻ"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Chia sẻ</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
