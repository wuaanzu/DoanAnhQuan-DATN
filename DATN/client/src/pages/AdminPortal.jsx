import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  FolderTree,
  AlertTriangle,
  Users,
  Package,
  Plus,
  Trash2,
  Lock,
  Check,
  ShoppingBag,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { adminService } from '@/services/adminService';
import { productService } from '@/services/productService';
import Button from '@/components/common/Button';

export default function AdminPortal() {
  const { isAdmin, isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState('categories'); // 'categories' | 'moderation' | 'reports' | 'users'
  const [stats, setStats] = useState({
    totalStudents: 6,
    lockedStudents: 0,
    totalProducts: 13,
    activeProducts: 10,
    pendingProducts: 2,
    completedTransactions: 1,
    pendingReports: 1,
  });

  // State cho Danh mục
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [catForm, setCatForm] = useState({
    categoryName: '',
    description: '',
    icon: 'Package',
    sortOrder: 0,
    status: 'Active',
  });

  // State cho Kiểm duyệt tin đăng
  const [products, setProducts] = useState([]);
  const [filterProductStatus, setFilterProductStatus] = useState('ALL');
  const [searchProduct, setSearchProduct] = useState('');

  // State cho Báo cáo vi phạm
  const [reports, setReports] = useState([
    {
      reportId: 1,
      reporterName: 'Trần Thu Hà (UET)',
      productTitle: 'Bàn phím cơ 68 phím switch Brown',
      reportedUserName: 'Võ Ngọc Linh',
      reason: 'Mô tả sai tình trạng sản phẩm',
      description: 'Người bán bảo còn mới 99% nhưng gặp mặt xem thì liệt 3 phím và trầy xước nhiều.',
      createdAt: '16/10/2026',
      status: 'Pending',
    },
    {
      reportId: 2,
      reporterName: 'Lê Hoàng Nam (NEU)',
      productTitle: 'Tài liệu đề thi & bài giải mẫu môn Kế toán',
      reportedUserName: 'Sinh viên ẩn danh',
      reason: 'Vi phạm quy chế thi cử / gian lận',
      description: 'Đăng bán đề thi nội bộ chưa được phép công khai.',
      createdAt: '12/10/2026',
      status: 'Resolved',
      resolution: 'Đã ẩn tin đăng và cảnh cáo người dùng',
    },
  ]);

  // State cho Quản lý sinh viên
  const [usersList, setUsersList] = useState([
    { userId: 1, fullName: 'Quản trị viên UniShare', email: 'admin@unishare.vn', role: 'Admin', school: 'UniShare System', status: 'Active' },
    { userId: 2, fullName: 'Nguyễn Minh Anh', email: 'anh.nm210001@sis.hust.edu.vn', role: 'Student', school: 'Đại học Bách Khoa Hà Nội', status: 'Active' },
    { userId: 3, fullName: 'Trần Thu Hà', email: 'ha.tt@vnu.edu.vn', role: 'Student', school: 'ĐHQG Hà Nội - UET', status: 'Active' },
    { userId: 4, fullName: 'Lê Hoàng Nam', email: 'nam.lh@st.neu.edu.vn', role: 'Student', school: 'Đại học Kinh tế Quốc dân', status: 'Active' },
    { userId: 5, fullName: 'Phạm Gia Bảo', email: 'bao.pg@stu.ptit.edu.vn', role: 'Student', school: 'Học viện CNBC Viễn thông', status: 'Active' },
    { userId: 6, fullName: 'Võ Ngọc Linh', email: 'linh.vn@ftu.edu.vn', role: 'Student', school: 'Trường Đại học Ngoại thương', status: 'Active' },
    { userId: 7, fullName: 'Đặng Quốc Huy', email: 'huy.dq@ntu-hn.edu.vn', role: 'Student', school: 'Trường Đại học Nguyễn Trãi (NTU)', status: 'Active' },
  ]);

  // Nạp dữ liệu ban đầu
  useEffect(() => {
    async function initData() {
      try {
        const statsRes = await adminService.getStats();
        setStats(statsRes);

        const catsRes = await adminService.getCategories();
        setCategories(Array.isArray(catsRes) ? catsRes : []);

        const prodsRes = await productService.getProducts({ limit: 50 });
        const list = prodsRes.data?.length ? prodsRes.data : [];
        setProducts(list);
      } catch (err) {
        console.error('Lỗi tải dữ liệu quản trị:', err);
      }
    }
    if (isAdmin) {
      initData();
    }
  }, [isAdmin]);

  // Nếu không phải Admin, chặn truy cập
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-3xl border border-rose-200 text-center space-y-4 shadow-sm">
        <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Khu Vực Quản Trị Hệ Thống</h2>
        <p className="text-xs text-slate-600">
          Chỉ có tài khoản có vai trò <strong>Quản trị viên (Admin)</strong> mới có quyền truy cập vào trang này để quản lý danh mục, kiểm duyệt sản phẩm và xử lý vi phạm.
        </p>
        <div className="pt-2 flex flex-col gap-2">
          <Link to="/login">
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
              Đăng nhập với tài khoản Admin
            </Button>
          </Link>
          <Link to="/">
            <Button variant="outline" className="w-full">
              Quay lại chợ đồ cũ sinh viên
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // --- XỬ LÝ DANH MỤC ---
  const handleOpenAddCat = () => {
    setEditingCat(null);
    setCatForm({
      categoryName: '',
      description: '',
      icon: 'Package',
      sortOrder: categories.length + 1,
      status: 'Active',
    });
    setShowCatModal(true);
  };

  const handleOpenEditCat = (cat) => {
    setEditingCat(cat);
    setCatForm({
      categoryName: cat.categoryName,
      description: cat.description || '',
      icon: cat.icon || 'Package',
      sortOrder: cat.sortOrder || 0,
      status: cat.status || 'Active',
    });
    setShowCatModal(true);
  };

  const handleSaveCat = async (e) => {
    e.preventDefault();
    if (!catForm.categoryName.trim()) {
      alert('Vui lòng nhập tên danh mục');
      return;
    }

    try {
      if (editingCat) {
        // Cập nhật
        await adminService.updateCategory(editingCat.categoryId, catForm);
        setCategories(
          categories.map((c) =>
            c.categoryId === editingCat.categoryId ? { ...c, ...catForm } : c
          )
        );
        alert('Cập nhật danh mục thành công!');
      } else {
        // Tạo mới
        const created = await adminService.createCategory(catForm);
        setCategories([...categories, created || { ...catForm, categoryId: Date.now() }]);
        alert('Thêm danh mục mới thành công!');
      }
      setShowCatModal(false);
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDeleteCat = async (catId) => {
    if (confirm('Bạn có chắc chắn muốn xóa/ẩn danh mục này?')) {
      try {
        await adminService.deleteCategory(catId);
        setCategories(categories.filter((c) => c.categoryId !== catId));
        alert('Đã xóa danh mục!');
      } catch (err) {
        alert(err?.response?.data?.message || err?.message || 'Không thể xóa danh mục đã có sản phẩm.');
      }
    }
  };

  // --- XỬ LÝ DUYỆT SẢN PHẨM ---
  const handleModerateProduct = (productId, newStatus) => {
    setProducts(
      products.map((p) => (p.productId === productId ? { ...p, status: newStatus } : p))
    );
    alert(`Đã cập nhật trạng thái sản phẩm sang: ${newStatus}`);
  };

  // --- XỬ LÝ BÁO CÁO ---
  const handleResolveReport = (reportId, action) => {
    setReports(
      reports.map((r) =>
        r.reportId === reportId
          ? {
              ...r,
              status: 'Resolved',
              resolution: action === 'lock-item' ? 'Đã khóa tin đăng vi phạm' : 'Đã bỏ qua báo cáo',
            }
          : r
      )
    );
    alert('Đã cập nhật xử lý báo cáo vi phạm!');
  };

  // --- XỬ LÝ KHÓA USER ---
  const handleToggleUserStatus = (userId) => {
    setUsersList(
      usersList.map((u) => {
        if (u.userId === userId) {
          const nextStatus = u.status === 'Active' ? 'Locked' : 'Active';
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
  };

  return (
    <div className="space-y-8 pb-16">
      {/* HEADER QUẢN TRỊ VIÊN */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-md border border-indigo-900/40">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            Cổng Quản Trị Hệ Thống (Admin Portal)
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Trung Tâm Quản Trị UniShare</h1>
          <p className="text-xs md:text-sm text-slate-300 max-w-xl">
            Toàn quyền quản lý danh mục đồ dùng, kiểm duyệt tin đăng của sinh viên, xử lý báo cáo vi phạm và giám sát tài khoản thành viên.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <ShoppingBag className="w-4 h-4" />
            Xem giao diện Chợ sinh viên
          </Link>
        </div>
      </div>

      {/* THẺ THỐNG KÊ QUẢN TRỊ TỔNG HỢP */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Tổng thành viên</span>
            <span className="text-2xl font-black text-slate-900 mt-0.5 block">{usersList.length}</span>
            <span className="text-[11px] text-blue-600 font-semibold">Tất cả các trường ĐH</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Tổng tin đồ cũ</span>
            <span className="text-2xl font-black text-slate-900 mt-0.5 block">{products.length || 13}</span>
            <span className="text-[11px] text-emerald-600 font-semibold">Đang hoạt động</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <FolderTree className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Danh mục đồ dùng</span>
            <span className="text-2xl font-black text-slate-900 mt-0.5 block">{categories.length || 8}</span>
            <span className="text-[11px] text-purple-600 font-semibold">Phân loại chuẩn</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Báo cáo vi phạm</span>
            <span className="text-2xl font-black text-rose-600 mt-0.5 block">
              {reports.filter((r) => r.status === 'Pending').length}
            </span>
            <span className="text-[11px] text-rose-600 font-semibold">Cần giải quyết ngay</span>
          </div>
        </div>
      </div>

      {/* THANH TAB 4 CHỨC NĂNG QUẢN TRỊ CHÍNH */}
      <div className="flex flex-wrap border-b border-slate-200 gap-6 text-sm font-bold">
        <button
          onClick={() => setActiveTab('categories')}
          className={`pb-3 relative transition-colors flex items-center gap-2 ${
            activeTab === 'categories' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          1. Quản lý Danh mục ({categories.length})
        </button>

        <button
          onClick={() => setActiveTab('moderation')}
          className={`pb-3 relative transition-colors flex items-center gap-2 ${
            activeTab === 'moderation' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Package className="w-4 h-4" />
          2. Kiểm duyệt tin đăng
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3 relative transition-colors flex items-center gap-2 ${
            activeTab === 'reports' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          3. Xử lý Báo cáo vi phạm
          {reports.some((r) => r.status === 'Pending') && (
            <span className="px-2 py-0.5 text-[10px] rounded-full bg-rose-500 text-white font-extrabold">
              {reports.filter((r) => r.status === 'Pending').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 relative transition-colors flex items-center gap-2 ${
            activeTab === 'users' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          4. Quản lý Sinh viên & Tài khoản ({usersList.length})
        </button>
      </div>

      {/* ======================================================== */}
      {/* CHỨC NĂNG 1: QUẢN LÝ DANH MỤC */}
      {/* ======================================================== */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-4">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Danh Sách Danh Mục Đồ Dùng</h3>
              <p className="text-xs text-slate-500">Cấu hình các loại đồ dùng cũ cho sinh viên đăng bán và tìm kiếm</p>
            </div>
            <button
              onClick={handleOpenAddCat}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Thêm danh mục mới
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Tên danh mục</th>
                  <th className="py-3 px-4">Mô tả</th>
                  <th className="py-3 px-4">Icon Lucide</th>
                  <th className="py-3 px-4">Thứ tự</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((cat) => (
                  <tr key={cat.categoryId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                        {cat.categoryName.charAt(0)}
                      </div>
                      <span>{cat.categoryName}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{cat.description || 'Chưa có mô tả'}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{cat.icon || 'Package'}</td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{cat.sortOrder ?? 0}</td>
                    <td className="py-3 px-4">
                      {cat.status === 'Active' ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          Hiển thị
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
                          Đã ẩn
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEditCat(cat)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-[11px]"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDeleteCat(cat.categoryId)}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold text-[11px]"
                      >
                        Xóa / Ẩn
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CHỨC NĂNG 2: KIỂM DUYỆT SẢN PHẨM */}
      {/* ======================================================== */}
      {activeTab === 'moderation' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-4">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Kiểm Duyệt & Quản Lý Tin Đăng</h3>
              <p className="text-xs text-slate-500">Giám sát các tin đăng từ sinh viên của tất cả các trường đại học</p>
            </div>
            <div className="flex gap-2">
              <select
                value={filterProductStatus}
                onChange={(e) => setFilterProductStatus(e.target.value)}
                className="text-xs p-2 border border-slate-200 rounded-xl outline-none bg-slate-50"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="Active">Đang hiển thị</option>
                <option value="Pending">Chờ duyệt</option>
                <option value="Locked">Đã khóa vi phạm</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Tên món đồ</th>
                  <th className="py-3 px-4">Người đăng</th>
                  <th className="py-3 px-4">Trường ĐH</th>
                  <th className="py-3 px-4">Giá / Hình thức</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Quyền Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products
                  .filter((p) => filterProductStatus === 'ALL' || p.status === filterProductStatus)
                  .map((prod) => (
                    <tr key={prod.productId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 max-w-xs truncate">{prod.title}</td>
                      <td className="py-3 px-4 text-slate-700">{prod.sellerName || 'Sinh viên'}</td>
                      <td className="py-3 px-4 font-medium text-indigo-700">{prod.universityShortName || 'HUST'}</td>
                      <td className="py-3 px-4 font-semibold text-emerald-800">
                        {prod.transactionType === 'Free'
                          ? 'Tặng 0đ'
                          : prod.transactionType === 'Exchange'
                          ? 'Trao đổi'
                          : `${Number(prod.price || 0).toLocaleString('vi-VN')} đ`}
                      </td>
                      <td className="py-3 px-4">
                        {prod.status === 'Active' ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            Hợp lệ
                          </span>
                        ) : prod.status === 'Pending' ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                            Chờ duyệt
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                            Bị khóa
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5">
                        {prod.status !== 'Active' && (
                          <button
                            onClick={() => handleModerateProduct(prod.productId, 'Active')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[11px]"
                          >
                            Duyệt tin
                          </button>
                        )}
                        {prod.status !== 'Locked' && (
                          <button
                            onClick={() => handleModerateProduct(prod.productId, 'Locked')}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold text-[11px]"
                          >
                            Khóa tin
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CHỨC NĂNG 3: XỬ LÝ BÁO CÁO VI PHẠM */}
      {/* ======================================================== */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span>
                Hệ thống nhận diện báo cáo tự động từ sinh viên về các trường hợp: lừa đảo, hàng cấm, sai thông tin, hẹn gặp bất thường.
              </span>
            </div>
            <span className="font-bold">Có {reports.filter((r) => r.status === 'Pending').length} báo cáo chưa xử lý</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {reports.map((rep) => (
              <div key={rep.reportId} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 uppercase tracking-wider">
                      {rep.reason}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm mt-1">
                      Món đồ bị báo cáo: <strong>{rep.productTitle}</strong>
                    </h4>
                  </div>
                  <div>
                    {rep.status === 'Pending' ? (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-bold">
                        Chờ Admin giải quyết
                      </span>
                    ) : (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                        Đã xử lý
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-xs text-slate-700 grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl">
                  <div>
                    <span className="text-slate-400 block">Người tố cáo:</span>
                    <p className="font-semibold text-slate-800">{rep.reporterName}</p>
                    <span className="text-slate-400 block mt-1">Người bị tố cáo:</span>
                    <p className="font-semibold text-rose-700">{rep.reportedUserName}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Chi tiết vi phạm:</span>
                    <p className="text-slate-700 italic">"{rep.description}"</p>
                    {rep.resolution && (
                      <p className="text-emerald-700 font-semibold mt-1">Kết quả: {rep.resolution}</p>
                    )}
                  </div>
                </div>

                {rep.status === 'Pending' && (
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleResolveReport(rep.reportId, 'lock-item')}
                      className="bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs"
                    >
                      Khóa tin đăng & Cảnh cáo người bán
                    </button>
                    <button
                      onClick={() => handleResolveReport(rep.reportId, 'dismiss')}
                      className="border border-slate-200 hover:bg-slate-100 text-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-semibold"
                    >
                      Bỏ qua (Báo cáo không đúng)
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CHỨC NĂNG 4: QUẢN LÝ TÀI KHOẢN SINH VIÊN */}
      {/* ======================================================== */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-4">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Danh Sách Sinh Viên & Tài Khoản</h3>
              <p className="text-xs text-slate-500">Giám sát trạng thái hoạt động của các thành viên trên hệ thống</p>
            </div>
            <div className="text-xs text-slate-500">
              Tổng số tài khoản: <strong>{usersList.length}</strong>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Họ và tên</th>
                  <th className="py-3 px-4">Email trường</th>
                  <th className="py-3 px-4">Trường Đại học</th>
                  <th className="py-3 px-4">Vai trò</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Quyền Quản Trị</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map((u) => (
                  <tr key={u.userId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{u.fullName}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{u.email}</td>
                    <td className="py-3 px-4 text-slate-700">{u.school}</td>
                    <td className="py-3 px-4">
                      {u.role === 'Admin' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800">
                          Quản trị viên
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          Sinh viên
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {u.status === 'Active' ? (
                        <span className="inline-flex items-center text-emerald-700 font-bold gap-1">
                          <Check className="w-3.5 h-3.5" /> Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-rose-600 font-bold gap-1">
                          <Lock className="w-3.5 h-3.5" /> Đã khóa
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.role !== 'Admin' && (
                        <button
                          onClick={() => handleToggleUserStatus(u.userId)}
                          className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                            u.status === 'Active'
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-600'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {u.status === 'Active' ? 'Khóa tài khoản' : 'Mở khóa'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL THÊM / SỬA DANH MỤC */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100 animate-in fade-in">
            <h3 className="text-lg font-bold text-slate-900">
              {editingCat ? 'Chỉnh Sửa Danh Mục' : 'Thêm Danh Mục Đồ Cũ Mới'}
            </h3>

            <form onSubmit={handleSaveCat} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên danh mục *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Dụng cụ vẽ kỹ thuật, Xe đạp..."
                  value={catForm.categoryName}
                  onChange={(e) => setCatForm({ ...catForm, categoryName: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mô tả ngắn</label>
                <input
                  type="text"
                  placeholder="Mô tả nhóm sản phẩm..."
                  value={catForm.description}
                  onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Thứ tự hiển thị</label>
                  <input
                    type="number"
                    value={catForm.sortOrder}
                    onChange={(e) => setCatForm({ ...catForm, sortOrder: Number(e.target.value) })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Trạng thái</label>
                  <select
                    value={catForm.status}
                    onChange={(e) => setCatForm({ ...catForm, status: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 bg-white"
                  >
                    <option value="Active">Hiển thị (Active)</option>
                    <option value="Hidden">Ẩn (Hidden)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl shadow-xs"
                >
                  Lưu danh mục
                </button>
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="px-4 py-2.5 border border-slate-200 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
