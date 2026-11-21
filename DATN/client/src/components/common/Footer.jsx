import React from 'react';
import { ShoppingBag, Heart, ShieldCheck } from 'lucide-react';
import { APP_CONFIG } from '@/utils/constants';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-800">{APP_CONFIG.NAME}</span>
              <span className="text-xs text-slate-500 block">Nền tảng mua bán & chia sẻ đồ cũ Học viện Công nghệ Bưu chính Viễn thông (PTIT)</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 inline" />
            <span>Đồ án tốt nghiệp CNTT - Đoàn Anh Quân (2310900085 - K23CNT1) • PTIT</span>
          </div>

          <div className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} UniShare PTIT • Km10 Nguyễn Trãi, Hà Đông, Hà Nội.
          </div>
        </div>
      </div>
    </footer>
  );
}
