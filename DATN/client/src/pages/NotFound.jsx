import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';
import Button from '@/components/common/Button';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">404</h1>
      <h2 className="text-xl font-semibold text-slate-800 mt-2">Không tìm thấy trang</h2>
      <p className="text-slate-500 text-sm max-w-sm mt-2">
        Đường dẫn bạn truy cập không tồn tại hoặc đã được di chuyển sang địa chỉ khác.
      </p>
      <Link to="/" className="mt-6">
        <Button>
          <Home className="w-4 h-4 mr-2" /> Về trang chủ
        </Button>
      </Link>
    </div>
  );
}
