import { Routes, Route } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import Home from '@/pages/Home';
import Dashboard from '@/pages/Dashboard';
import AdminPortal from '@/pages/AdminPortal';
import Messages from '@/pages/Messages';
import About from '@/pages/About';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import NotFound from '@/pages/NotFound';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Các route nằm trong layout chung (có Navbar và Footer) */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="messages" element={<Messages />} />
        <Route path="admin" element={<AdminPortal />} />
        <Route path="about" element={<About />} />
      </Route>

      {/* Tuyến đường Đăng nhập & Đăng ký */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Bắt tất cả các đường dẫn không hợp lệ (404) */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
