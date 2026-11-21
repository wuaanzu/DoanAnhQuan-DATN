import axios from 'axios';
import { APP_CONFIG } from '@/utils/constants';

// Khởi tạo instance Axios dùng chung
const api = axios.create({
  baseURL: APP_CONFIG.API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Tự động đính kèm token nếu đã đăng nhập
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(APP_CONFIG.STORAGE_KEY_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Xử lý response & bắt lỗi tập trung
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Ví dụ: Bắt lỗi 401 Unauthorized để xử lý đăng xuất hoặc chuyển hướng
    if (error.response && error.response.status === 401) {
      console.warn('Phiên đăng nhập đã hết hạn hoặc không có quyền.');
      // Có thể xóa token và chuyển hướng tới login:
      // localStorage.removeItem(APP_CONFIG.STORAGE_KEY_TOKEN);
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
