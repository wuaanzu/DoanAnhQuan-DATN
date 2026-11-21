import { createContext, useState, useEffect } from 'react';
import { APP_CONFIG } from '@/utils/constants';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Đọc thông tin từ localStorage khi khởi động app
  useEffect(() => {
    const savedToken = localStorage.getItem(APP_CONFIG.STORAGE_KEY_TOKEN);
    const savedUser = localStorage.getItem(APP_CONFIG.STORAGE_KEY_USER);

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (err) {
        console.error('Lỗi phân tích dữ liệu người dùng:', err);
        localStorage.removeItem(APP_CONFIG.STORAGE_KEY_TOKEN);
        localStorage.removeItem(APP_CONFIG.STORAGE_KEY_USER);
      }
    }
    setLoading(false);
  }, []);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem(APP_CONFIG.STORAGE_KEY_TOKEN, authToken);
    localStorage.setItem(APP_CONFIG.STORAGE_KEY_USER, JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(APP_CONFIG.STORAGE_KEY_TOKEN);
    localStorage.removeItem(APP_CONFIG.STORAGE_KEY_USER);
  };

  const isAdmin = user?.role === 'Admin';
  const isStudent = user?.role === 'Student' || user?.role === 'User';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isAdmin,
        isStudent,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
