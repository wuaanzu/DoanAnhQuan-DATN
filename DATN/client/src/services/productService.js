import api from './api';

export const productService = {
  // Lấy danh sách sản phẩm với bộ lọc
  getProducts: async (params = {}) => {
    try {
      const res = await api.get('/products', { params });
      return res.data ? res : { data: res };
    } catch (err) {
      console.error('Lỗi tải sản phẩm từ API:', err);
      return { data: [] };
    }
  },

  // Chi tiết sản phẩm
  getProductDetail: async (id) => {
    try {
      const res = await api.get(`/products/${id}`);
      return res.data || res;
    } catch (err) {
      console.error('Lỗi tải chi tiết sản phẩm:', err);
      throw err;
    }
  },

  // Danh mục
  getCategories: async () => {
    try {
      const res = await api.get('/catalog/categories');
      return res.data || res || [];
    } catch {
      return [
        { categoryId: 1, categoryName: 'Sách & Giáo trình', icon: 'BookOpen' },
        { categoryId: 3, categoryName: 'Đồ điện tử', icon: 'Laptop' },
        { categoryId: 4, categoryName: 'Quần áo', icon: 'Shirt' },
        { categoryId: 5, categoryName: 'Đồ gia dụng', icon: 'CookingPot' },
        { categoryId: 6, categoryName: 'Đồ dùng học tập', icon: 'PencilRuler' },
        { categoryId: 8, categoryName: 'Khác', icon: 'Package' },
      ];
    }
  },

  // Danh sách trường đại học
  getUniversities: async () => {
    try {
      const res = await api.get('/catalog/universities');
      return res.data || res || [];
    } catch {
      return [
        { universityId: 4, shortName: 'PTIT', universityName: 'Học viện Công nghệ Bưu chính Viễn thông' },
      ];
    }
  },

  // Tin đăng của tôi
  getMyProducts: async () => {
    try {
      const res = await api.get('/products/mine');
      return res.data || res || [];
    } catch {
      return [];
    }
  },

  // Yêu thích
  getFavorites: async () => {
    try {
      const res = await api.get('/favorites');
      return res.data || res || [];
    } catch {
      return [];
    }
  },

  toggleFavorite: async (productId) => {
    try {
      const res = await api.post(`/favorites/${productId}`);
      return res.data || res;
    } catch (err) {
      throw err;
    }
  },
};

