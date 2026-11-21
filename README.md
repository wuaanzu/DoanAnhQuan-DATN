# Đồ Án Tốt Nghiệp: UniShare PTIT

> **Nền tảng Trao Đổi & Mua Bán Đồ Dùng Cũ Dành Cho Sinh Viên Học Viện Công Nghệ Bưu Chính Viễn Thông**

---

## 📌 Thông Tin Sinh Viên & Đề Tài
- **Sinh viên thực hiện:** Đoàn Anh Quân
- **Mã sinh viên:** 2310900085
- **Lớp:** K23CNT1
- **Khoa:** Công Nghệ Thông Tin - Học Viện Công Nghệ Bưu Chính Viễn Thông (PTIT)
- **Tên đề tài:** Nghiên cứu & xây dựng nền tảng trao đổi, mua bán đồ dùng cũ dành cho sinh viên PTIT (UniShare PTIT)

---

## 🚀 Giới Thiệu Dự Án
UniShare PTIT là nền tảng thương mại điện tử C2C thu nhỏ dành riêng cho cộng đồng sinh viên Học viện Công nghệ Bưu chính Viễn thông (Km10 Nguyễn Trãi, Hà Đông & Hoàng Quốc Việt). Hệ thống giải quyết bài toán lãng phí đồ dùng còn giá trị sử dụng (giáo trình CNTT, ĐTVT, ATTT, máy tính cầm tay, kit vi điều khiển thực hành, đồ gia dụng phòng trọ KTX) bằng cách kết nối sinh viên PTIT mua bán, trao đổi hoặc tặng miễn phí trực tiếp trong khuôn viên trường với độ tin cậy và an toàn cao.

---

## 🛠️ Kiến Trúc & Công Nghệ Sử Dụng
- **Frontend:** React 19, Vite, Tailwind CSS, Lucide Icons, Axios, React Router DOM
- **Backend:** Node.js, Express.js, JWT, bcryptjs, CORS
- **Cơ sở dữ liệu:** Microsoft SQL Server (MSSQL / LocalDB)
- **Cấu trúc dự án:**
  - `DATN/client`: Mã nguồn giao diện người dùng
  - `DATN/server`: RESTful API backend và xử lý nghiệp vụ
  - `DATN/database`: Scripts khởi tạo cơ sở dữ liệu và dữ liệu mẫu

---

## 💻 Hướng Dẫn Cài Đặt & Chạy Dự Án

### 1. Chuẩn bị Cơ sở dữ liệu
Chạy các file SQL trong thư mục `DATN/database/` trên SQL Server để tạo cơ sở dữ liệu `UniShareDB` và dữ liệu mẫu.

### 2. Khởi chạy Backend Server
```bash
cd DATN/server
npm install
npm run dev
```
Backend sẽ khởi chạy tại: `http://localhost:5000`

### 3. Khởi chạy Frontend Client
```bash
cd DATN/client
npm install
npm run dev
```
Frontend sẽ khởi chạy tại: `http://localhost:3000`
