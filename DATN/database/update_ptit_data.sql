SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;

-- 1. Cập nhật tất cả người dùng thành sinh viên PTIT
UPDATE dbo.Users
SET UniversityId = 4,
    Email = CASE 
      WHEN UserId = 7 THEN 'quan.da23@stu.ptit.edu.vn'
      WHEN UserId = 2 THEN 'anh.nm@stu.ptit.edu.vn'
      WHEN UserId = 3 THEN 'ha.tt@stu.ptit.edu.vn'
      WHEN UserId = 4 THEN 'nam.lh@stu.ptit.edu.vn'
      WHEN UserId = 5 THEN 'bao.pg@stu.ptit.edu.vn'
      WHEN UserId = 6 THEN 'linh.vn@stu.ptit.edu.vn'
      ELSE Email
    END,
    StudentCode = CASE
      WHEN UserId = 7 THEN 'B23DCCN085'
      WHEN UserId = 2 THEN 'B22DCDT015'
      WHEN UserId = 3 THEN 'B22DCAT088'
      WHEN UserId = 4 THEN 'B21DCMR042'
      WHEN UserId = 5 THEN 'B21DCCN004'
      WHEN UserId = 6 THEN 'B23DCQT019'
      ELSE StudentCode
    END
WHERE UserId IN (2, 3, 4, 5, 6, 7);

-- 2. Cập nhật tất cả các sản phẩm hiện có sang UniversityId = 4 (PTIT)
UPDATE dbo.Products
SET UniversityId = 4,
    Location = CASE
      WHEN ProductId IN (1, 11) THEN N'Thư viện PTIT tầng 2 - Nhà A1'
      WHEN ProductId IN (2, 7) THEN N'Giảng đường A2 - Km10 Nguyễn Trãi'
      WHEN ProductId IN (3, 13) THEN N'Căng tin PTIT - Cơ sở Hà Đông'
      WHEN ProductId IN (5, 9) THEN N'Ký túc xá B4 PTIT Hà Đông'
      WHEN ProductId IN (6, 10) THEN N'Ngõ Ao Sen (Đối diện PTIT)'
      WHEN ProductId = 8 THEN N'Sảnh Giảng đường A2 PTIT'
      WHEN ProductId = 12 THEN N'Bãi xe sinh viên PTIT'
      WHEN ProductId = 14 THEN N'Giảng đường A3 PTIT'
      ELSE Location
    END;

-- 3. Thêm các sản phẩm đặc trưng cho sinh viên PTIT
-- Sản phẩm 15: Kit STM32F4
IF NOT EXISTS (SELECT 1 FROM dbo.Products WHERE Title LIKE N'%Kit thực hành vi điều khiển STM32F4%')
BEGIN
    INSERT INTO dbo.Products (UserId, CategoryId, UniversityId, Title, Description, Price, [Condition], TransactionType, DesiredExchange, Location, Status, ModerationNote, ViewCount, IsDeleted, CreatedAt, UpdatedAt)
    VALUES (2, 3, 4, N'Kit thực hành vi điều khiển STM32F401 + Mạch nạp ST-Link', N'Kit STM32F4 Blackpill dùng thực hành môn Vi xử lý / Hệ thống nhúng khoa ĐTVT PTIT. Tặng kèm dây cáp, mạch nạp ST-Link và code mẫu Keil C.', 250000, 'LikeNew', 'Sell', NULL, N'Phòng Lab Viễn thông - Nhà A3 PTIT', 'Active', NULL, 64, 0, SYSUTCDATETIME(), SYSUTCDATETIME());
    
    DECLARE @pid1 INT = SCOPE_IDENTITY();
    INSERT INTO dbo.ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
    VALUES (@pid1, '/uploads/seed/p03.png', 1, 1, SYSUTCDATETIME());
END;

-- Sản phẩm 16: Giáo trình Cấu trúc dữ liệu và giải thuật PTIT
IF NOT EXISTS (SELECT 1 FROM dbo.Products WHERE Title LIKE N'%Cấu trúc dữ liệu và giải thuật - PTIT%')
BEGIN
    INSERT INTO dbo.Products (UserId, CategoryId, UniversityId, Title, Description, Price, [Condition], TransactionType, DesiredExchange, Location, Status, ModerationNote, ViewCount, IsDeleted, CreatedAt, UpdatedAt)
    VALUES (7, 2, 4, N'Giáo trình Cấu trúc dữ liệu và giải thuật - PTIT', N'Giáo trình môn Cấu trúc dữ liệu & giải thuật học kỳ 3 PTIT, có kèm note bài tập code C++ và đề thi các năm trước của các thầy cô khoa CNTT.', 25000, 'Good', 'Sell', NULL, N'Giảng đường A2 - PTIT, Km10 Nguyễn Trãi', 'Active', NULL, 85, 0, SYSUTCDATETIME(), SYSUTCDATETIME());

    DECLARE @pid2 INT = SCOPE_IDENTITY();
    INSERT INTO dbo.ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
    VALUES (@pid2, '/uploads/seed/p01.png', 1, 1, SYSUTCDATETIME());
END;

-- Sản phẩm 17: Board Arduino Uno R3 + Cảm biến IoT
IF NOT EXISTS (SELECT 1 FROM dbo.Products WHERE Title LIKE N'%Board Arduino Uno R3%')
BEGIN
    INSERT INTO dbo.Products (UserId, CategoryId, UniversityId, Title, Description, Price, [Condition], TransactionType, DesiredExchange, Location, Status, ModerationNote, ViewCount, IsDeleted, CreatedAt, UpdatedAt)
    VALUES (7, 3, 4, N'Board Arduino Uno R3 + Bộ cảm biến thực hành IoT PTIT', N'Combo gồm board Arduino Uno R3, test board cắm dây, cảm biến nhiệt độ DHT11, cảm biến khoảng cách siêu âm, màn hình LCD 1602 I2C phục vụ môn Đồ án cơ sở & IoT.', 160000, 'LikeNew', 'Sell', NULL, N'Ký túc xá B4 PTIT - Cơ sở Hà Đông', 'Active', NULL, 48, 0, SYSUTCDATETIME(), SYSUTCDATETIME());

    DECLARE @pid3 INT = SCOPE_IDENTITY();
    INSERT INTO dbo.ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
    VALUES (@pid3, '/uploads/seed/p04.png', 1, 1, SYSUTCDATETIME());
END;

-- Sản phẩm 18: Áo khoác gió đồng phục PTIT màu đỏ mận
IF NOT EXISTS (SELECT 1 FROM dbo.Products WHERE Title LIKE N'%Áo khoác gió đồng phục PTIT%')
BEGIN
    INSERT INTO dbo.Products (UserId, CategoryId, UniversityId, Title, Description, Price, [Condition], TransactionType, DesiredExchange, Location, Status, ModerationNote, ViewCount, IsDeleted, CreatedAt, UpdatedAt)
    VALUES (3, 4, 4, N'Áo khoác gió đồng phục PTIT màu đỏ mận size L', N'Áo khoác gió đồng phục PTIT chính hãng 2 lớp ấm áp, khóa kéo trơn tru, phù hợp bạn nào cao 1m68-1m78. Tặng miễn phí cho tân sinh viên.', 0, 'Good', 'Free', NULL, N'Căng tin PTIT - Cạnh sân bóng', 'Active', NULL, 92, 0, SYSUTCDATETIME(), SYSUTCDATETIME());

    DECLARE @pid4 INT = SCOPE_IDENTITY();
    INSERT INTO dbo.ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
    VALUES (@pid4, '/uploads/seed/p05.png', 1, 1, SYSUTCDATETIME());
END;

-- Sản phẩm 19: Giáo trình Kiến trúc máy tính & Hợp ngữ
IF NOT EXISTS (SELECT 1 FROM dbo.Products WHERE Title LIKE N'%Kiến trúc máy tính & Hợp ngữ%')
BEGIN
    INSERT INTO dbo.Products (UserId, CategoryId, UniversityId, Title, Description, Price, [Condition], TransactionType, DesiredExchange, Location, Status, ModerationNote, ViewCount, IsDeleted, CreatedAt, UpdatedAt)
    VALUES (5, 2, 4, N'Sách Kiến trúc máy tính & Hợp ngữ Assembly (PTIT)', N'Sách học môn Kiến trúc máy tính và hợp ngữ khoa CNTT PTIT. Sách còn mới 90%, đã bọc bìa cẩn thận.', 0, 'Good', 'Exchange', N'Đổi lấy giáo trình Hệ điều hành hoặc Mạng máy tính PTIT', N'Thư viện PTIT tầng 2 - Nhà A1', 'Active', NULL, 53, 0, SYSUTCDATETIME(), SYSUTCDATETIME());

    DECLARE @pid5 INT = SCOPE_IDENTITY();
    INSERT INTO dbo.ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
    VALUES (@pid5, '/uploads/seed/p02.png', 1, 1, SYSUTCDATETIME());
END;

-- Sản phẩm 20: Bàn phím cơ Akko 3087
IF NOT EXISTS (SELECT 1 FROM dbo.Products WHERE Title LIKE N'%Bàn phím cơ Akko 3087%')
BEGIN
    INSERT INTO dbo.Products (UserId, CategoryId, UniversityId, Title, Description, Price, [Condition], TransactionType, DesiredExchange, Location, Status, ModerationNote, ViewCount, IsDeleted, CreatedAt, UpdatedAt)
    VALUES (7, 3, 4, N'Bàn phím cơ Akko 3087 switch Orange gõ code PTIT', N'Bàn phím cơ gõ êm mượt, không ồn phòng ký túc xá, keycap PBT không bóng mờ, cực hợp anh em sinh viên IT lập trình đêm.', 480000, 'LikeNew', 'Sell', NULL, N'Cổng trường PTIT - Km10 Nguyễn Trãi', 'Active', NULL, 76, 0, SYSUTCDATETIME(), SYSUTCDATETIME());

    DECLARE @pid6 INT = SCOPE_IDENTITY();
    INSERT INTO dbo.ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
    VALUES (@pid6, '/uploads/seed/p13.png', 1, 1, SYSUTCDATETIME());
END;

-- Sản phẩm 21: Màn hình phụ 22 inch Full HD
IF NOT EXISTS (SELECT 1 FROM dbo.Products WHERE Title LIKE N'%Màn hình máy tính phụ 22 inch%')
BEGIN
    INSERT INTO dbo.Products (UserId, CategoryId, UniversityId, Title, Description, Price, [Condition], TransactionType, DesiredExchange, Location, Status, ModerationNote, ViewCount, IsDeleted, CreatedAt, UpdatedAt)
    VALUES (7, 3, 4, N'Màn hình máy tính phụ 22 inch Full HD cho sinh viên code đồ án', N'Màn hình viền mỏng IPS, độ phân giải 1080p, có cổng HDMI & VGA. Dùng mở rộng màn hình code đồ án tốt nghiệp cực tiện.', 800000, 'Good', 'Sell', NULL, N'Ngõ Ao Sen (Đối diện Học viện PTIT)', 'Active', NULL, 110, 0, SYSUTCDATETIME(), SYSUTCDATETIME());

    DECLARE @pid7 INT = SCOPE_IDENTITY();
    INSERT INTO dbo.ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
    VALUES (@pid7, '/uploads/seed/p03.png', 1, 1, SYSUTCDATETIME());
END;

-- Sản phẩm 22: Giáo trình An toàn thông tin & Mật mã học
IF NOT EXISTS (SELECT 1 FROM dbo.Products WHERE Title LIKE N'%An toàn thông tin & Mật mã học%')
BEGIN
    INSERT INTO dbo.Products (UserId, CategoryId, UniversityId, Title, Description, Price, [Condition], TransactionType, DesiredExchange, Location, Status, ModerationNote, ViewCount, IsDeleted, CreatedAt, UpdatedAt)
    VALUES (5, 2, 4, N'Giáo trình An toàn thông tin & Mật mã học (Khoa ATTT - PTIT)', N'Tài liệu môn Cơ sở an toàn thông tin & mật mã học cổ điển/hiện đại (AES, RSA, ECC). Tặng kèm file slide và đề cương ôn tập.', 35000, 'LikeNew', 'Sell', NULL, N'Giảng đường A2 PTIT', 'Active', NULL, 67, 0, SYSUTCDATETIME(), SYSUTCDATETIME());

    DECLARE @pid8 INT = SCOPE_IDENTITY();
    INSERT INTO dbo.ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
    VALUES (@pid8, '/uploads/seed/p01.png', 1, 1, SYSUTCDATETIME());
END;

-- Sản phẩm 23: Balo PTIT chống nước
IF NOT EXISTS (SELECT 1 FROM dbo.Products WHERE Title LIKE N'%Balo PTIT chống nước%')
BEGIN
    INSERT INTO dbo.Products (UserId, CategoryId, UniversityId, Title, Description, Price, [Condition], TransactionType, DesiredExchange, Location, Status, ModerationNote, ViewCount, IsDeleted, CreatedAt, UpdatedAt)
    VALUES (4, 7, 4, N'Balo PTIT chống nước đựng vừa laptop 15.6 inch', N'Balo vải dù Oxford chống nước tốt, nhiều ngăn để laptop, sạc, giáo trình dày.', 0, 'Good', 'Exchange', N'Đổi lấy chuột không dây Logitech hoặc tai nghe chân Type-C', N'Ký túc xá B4 PTIT', 'Active', NULL, 45, 0, SYSUTCDATETIME(), SYSUTCDATETIME());

    DECLARE @pid9 INT = SCOPE_IDENTITY();
    INSERT INTO dbo.ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
    VALUES (@pid9, '/uploads/seed/p09.png', 1, 1, SYSUTCDATETIME());
END;
