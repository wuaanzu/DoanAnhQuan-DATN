// Các hằng số cấu hình hệ thống
export const APP_CONFIG = {
  NAME: 'UniShare PTIT',
  TOPIC: 'XÂY DỰNG NỀN TẢNG CHIA SẺ VÀ TRAO ĐỔI ĐỒ DÙNG CŨ TRONG HỌC VIỆN CÔNG NGHỆ BƯU CHÍNH VIỄN THÔNG (PTIT)',
  SUBTITLE: 'Nền Tảng Quản Lý & Trao Đổi Đồ Dùng Cũ Sinh Viên PTIT',
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  STORAGE_KEY_TOKEN: 'unishare_token',
  STORAGE_KEY_USER: 'unishare_user',
};

// Menu điều hướng chính
export const NAV_LINKS = [
  { path: '/', label: 'Chợ đồ cũ PTIT' },
  { path: '/dashboard', label: 'Bảng điều khiển quản lý' },
  { path: '/about', label: 'Giới thiệu' },
];

export const TRANSACTION_TYPES = {
  Sell: { label: 'Bán lại giá rẻ', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  Exchange: { label: 'Trao đổi đồ', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  Free: { label: 'Tặng miễn phí 0đ', color: 'bg-purple-50 text-purple-700 border-purple-200' },
};

export const CONDITIONS = {
  New: { label: 'Mới 99-100%', color: 'text-emerald-600' },
  Good: { label: 'Còn rất tốt', color: 'text-blue-600' },
  Used: { label: 'Đã qua sử dụng', color: 'text-amber-600' },
  NeedsRepair: { label: 'Cần sửa chữa nhẹ', color: 'text-rose-600' },
};

export const USER_ROLES = {
  ADMIN: 'Admin',
  STUDENT: 'Student',
};
