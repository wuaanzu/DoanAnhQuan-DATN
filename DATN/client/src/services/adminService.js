import api from './api';

export const adminService = {
  // Thống kê tổng quan hệ thống
  getStats: async () => {
    try {
      const res = await api.get('/admin/stats');
      return res.data || res;
    } catch (err) {
      console.error('Lỗi lấy thống kê admin:', err);
      // Fallback số liệu mô phỏng
      return {
        totalStudents: 6,
        lockedStudents: 0,
        totalProducts: 13,
        activeProducts: 10,
        pendingProducts: 2,
        completedTransactions: 1,
        pendingReports: 0,
      };
    }
  },

  // Quản lý danh mục
  getCategories: async () => {
    try {
      const res = await api.get('/catalog/categories?all=true');
      return res.data || res;
    } catch (err) {
      console.error('Lỗi lấy danh mục:', err);
      return [];
    }
  },

  createCategory: async (data) => {
    const res = await api.post('/catalog/categories', data);
    return res.data || res;
  },

  updateCategory: async (id, data) => {
    const res = await api.put(`/catalog/categories/${id}`, data);
    return res.data || res;
  },

  deleteCategory: async (id) => {
    const res = await api.delete(`/catalog/categories/${id}`);
    return res.data || res;
  },

  // Quản lý tin đăng & Kiểm duyệt
  getAllProducts: async (params = {}) => {
    try {
      const res = await api.get('/admin/products', { params });
      return res.data?.items ? res.data : (Array.isArray(res.data) ? { items: res.data } : res);
    } catch (err) {
      console.error('Lỗi lấy danh sách sản phẩm quản trị:', err);
      return { items: [] };
    }
  },

  moderateProduct: async (id, data) => {
    const res = await api.patch(`/admin/products/${id}/moderate`, data);
    return res.data || res;
  },

  // Quản lý báo cáo vi phạm
  getReports: async (params = {}) => {
    try {
      const res = await api.get('/admin/reports', { params });
      return res.data?.items ? res.data : (Array.isArray(res.data) ? { items: res.data } : res);
    } catch (err) {
      console.error('Lỗi lấy báo cáo vi phạm:', err);
      return { items: [] };
    }
  },

  resolveReport: async (id, data) => {
    const res = await api.patch(`/admin/reports/${id}/resolve`, data);
    return res.data || res;
  },

  // Quản lý tài khoản sinh viên
  getUsers: async (params = {}) => {
    try {
      const res = await api.get('/admin/users', { params });
      return res.data?.items ? res.data : (Array.isArray(res.data) ? { items: res.data } : res);
    } catch (err) {
      console.error('Lỗi lấy danh sách người dùng:', err);
      return { items: [] };
    }
  },

  updateUserStatus: async (userId, status) => {
    const res = await api.patch(`/admin/users/${userId}/status`, { status });
    return res.data || res;
  },
};
