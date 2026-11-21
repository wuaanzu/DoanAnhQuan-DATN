# ĐỒ ÁN TỐT NGHIỆP: XÂY DỰNG NỀN TẢNG CHIA SẺ VÀ TRAO ĐỔI ĐỒ DÙNG CŨ TRONG TRƯỜNG ĐẠI HỌC (UniShare)

- **Họ và tên sinh viên**: Đoàn Anh Quân
- **Mã số sinh viên**: 2310900085
- **Lớp**: K23CNT1
- **Khoa**: Công nghệ Thông tin

---

## 🎯 1. Giới Thiệu Đề Tài

**UniShare** là nền tảng thương mại điện tử C2C thu nhỏ kết hợp chia sẻ cộng đồng dành riêng cho sinh viên các trường đại học. Hệ thống giải quyết vấn đề lãng phí đồ dùng sinh viên sau mỗi kỳ học (giáo trình, sách tham khảo, máy tính cầm tay, thiết bị điện tử, đồ gia dụng phòng trọ/KTX).

### Các Giá Trị Cốt Lõi:
1. **Tiết kiệm chi phí**: Sinh viên mua lại giáo trình, vật dụng cũ với giá rẻ hơn 50–80% hoặc nhận đồ tặng miễn phí (0đ).
2. **Giao dịch an toàn**: Hẹn gặp trực tiếp trong khuôn viên trường đại học (giảng đường, thư viện, ký túc xá).
3. **Bảo vệ môi trường**: Tái sử dụng đồ dùng, giảm lượng rác thải nhựa và thiết bị cũ.

---

## 🚀 2. Công Nghệ Tích Hợp

### Frontend (`client/`)
- **React 19 & Vite 8**: SPA tốc độ cao, Hot Module Replacement tức thì.
- **Tailwind CSS v4**: Giao diện hiện đại, responsive hoàn chỉnh trên di động và máy tính.
- **React Router DOM v7**: Điều hướng client-side, bảo vệ route.
- **Axios & Lucide React**: Quản lý API interceptor và bộ icon đồng bộ.

### Backend (`server/`)
- **Node.js & Express**: Xây dựng RESTful API cho toàn bộ nghiệp vụ (sản phẩm, giao dịch, người dùng, báo cáo).
- **Socket.IO**: Hỗ trợ trao đổi tin nhắn và thông báo thời gian thực.
- **JWT & Bcrypt**: Xác thực tài khoản an toàn qua JWT Token và mã hóa mật khẩu.

### Cơ Sở Dữ Liệu (`database/`)
- **Microsoft SQL Server (LocalDB / SQL Server Express)**: Database `UniShareDB` với 14 bảng quan hệ, ràng buộc toàn vẹn và dữ liệu mẫu đầy đủ.

---

## 📁 3. Cấu Trúc Dự Án

```text
DATN/
├── client/                     # Mã nguồn giao diện người dùng (ReactJS + Tailwind CSS)
│   ├── src/
│   │   ├── assets/             # Hình ảnh (hero banner UniShare, icons)
│   │   ├── components/         # Các thành phần tái sử dụng (Navbar, Footer, Button, Card)
│   │   ├── pages/              # Các trang chính:
│   │   │   ├── Home.jsx        # Chợ đồ cũ sinh viên (tìm kiếm, lọc theo trường, danh mục)
│   │   │   ├── Dashboard.jsx   # Bảng điều khiển quản lý (tin đăng, yêu cầu, thống kê)
│   │   │   ├── About.jsx       # Hồ sơ đề tài tốt nghiệp & tác giả
│   │   │   └── Login.jsx       # Đăng nhập hệ thống (hỗ trợ tài khoản mẫu)
│   │   ├── services/           # Kết nối API Backend (auth, products)
│   │   └── utils/              # Hằng số cấu hình hệ thống
│   └── vite.config.js          # Cấu hình Vite & port 3000
├── database/
│   └── UniShareDB.sql          # Kịch bản khởi tạo CSDL SQL Server và dữ liệu mẫu
└── server/                     # Máy chủ RESTful API Backend
    ├── config/                 # Cấu hình DB (db.js) và biến môi trường (env.js)
    ├── middlewares/            # Xác thực auth, upload ảnh, bắt lỗi tập trung
    ├── services/               # Xử lý nghiệp vụ (product, transaction, auth, catalog...)
    └── server.js               # Entry point Express API (port 5000)
```

---

## 🛠️ 4. Hướng Dẫn Cài Đặt & Khởi Chạy

### Bước 1: Khởi động Cơ sở dữ liệu SQL Server
Đảm bảo SQL LocalDB hoặc SQL Server đang chạy:
```powershell
sqllocaldb start MSSQLLocalDB
```
Nạp file CSDL `database/UniShareDB.sql` (nếu chưa có):
```powershell
sqlcmd -S "(localdb)\MSSQLLocalDB" -E -i database\UniShareDB.sql -f 65001
```

### Bước 2: Khởi động Backend API Server (Port 5000)
```powershell
npm --prefix server run dev
```
> API Server sẽ hoạt động tại: **`http://localhost:5000`**

### Bước 3: Khởi động Frontend Client (Port 3000)
```powershell
npm --prefix client run dev
```
> Giao diện web sẽ tự động mở tại: **`http://localhost:3000`**

---

## 🔑 5. Tài Khoản Thử Nghiệm Sẵn Có

Mật khẩu chung cho tất cả tài khoản demo: **`Unishare@123`**

| Vai trò | Email đăng nhập | Trường đại học |
| :--- | :--- | :--- |
| **Sinh viên** | `anh.nm210001@sis.hust.edu.vn` | ĐH Bách Khoa Hà Nội |
| **Sinh viên** | `ha.tt@vnu.edu.vn` | ĐHQG Hà Nội |
| **Quản trị viên** | `admin@unishare.vn` | Hệ thống UniShare |
