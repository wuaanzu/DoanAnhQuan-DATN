SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;

-- 1. Cập nhật thông tin người dùng sang sinh viên PTIT
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

-- 2. Cập nhật các sản phẩm cũ thành chuẩn PTIT
UPDATE dbo.Products
SET UniversityId = 4;

UPDATE dbo.Products
SET Title = N'Giáo trình Giải tích 1 & Đại số tuyến tính - PTIT',
    Location = N'Thư viện PTIT tầng 2 - Nhà A1'
WHERE ProductId = 1;

UPDATE dbo.Products
SET Title = N'Sách Clean Code - Mã sạch cho sinh viên IT PTIT',
    Location = N'Giảng đường A2 - Km10 Nguyễn Trãi'
WHERE ProductId = 2;

UPDATE dbo.Products
SET Location = N'Căng tin PTIT - Cơ sở Hà Đông'
WHERE ProductId = 3;

UPDATE dbo.Products
SET Location = N'Căng tin PTIT - Gần sân bóng'
WHERE ProductId = 4;

UPDATE dbo.Products
SET Title = N'Áo khoác đồng phục khoa CNTT - PTIT size L',
    Location = N'Ký túc xá B4 PTIT Hà Đông'
WHERE ProductId = 5;

UPDATE dbo.Products
SET Location = N'Ngõ Ao Sen (Đối diện Học viện PTIT)'
WHERE ProductId = 6;

UPDATE dbo.Products
SET Title = N'Máy tính Casio FX-580VN X dán sticker PTIT IT',
    Location = N'Giảng đường A2 - Km10 Nguyễn Trãi'
WHERE ProductId = 7;

UPDATE dbo.Products
SET Title = N'Bộ compa & thước vẽ kỹ thuật sinh viên PTIT',
    Location = N'Sảnh Giảng đường A2 PTIT'
WHERE ProductId = 8;

UPDATE dbo.Products
SET Location = N'Ký túc xá B4 PTIT Hà Đông'
WHERE ProductId = 9;

UPDATE dbo.Products
SET Location = N'Ngõ Ao Sen (Đối diện PTIT)'
WHERE ProductId = 10;

UPDATE dbo.Products
SET Location = N'Thư viện PTIT tầng 2 - Nhà A1'
WHERE ProductId = 11;

UPDATE dbo.Products
SET Location = N'Bãi xe sinh viên PTIT'
WHERE ProductId = 12;

UPDATE dbo.Products
SET Location = N'Căng tin PTIT - Cơ sở Hà Đông'
WHERE ProductId = 13;

UPDATE dbo.Products
SET Title = N'Bộ dụng cụ thực hành điện tử & dây cắm testboard PTIT',
    Location = N'Giảng đường A3 PTIT'
WHERE ProductId = 14;

-- 3. Bổ sung các sản phẩm đặc thù PTIT còn thiếu
-- Kit STM32F4
IF NOT EXISTS (SELECT 1 FROM dbo.Products WHERE Title LIKE N'%STM32F4%')
BEGIN
    INSERT INTO dbo.Products (UserId, CategoryId, UniversityId, Title, Description, Price, [Condition], TransactionType, DesiredExchange, Location, Status, ModerationNote, ViewCount, IsDeleted, CreatedAt, UpdatedAt)
    VALUES (2, 3, 4, N'Kit thực hành vi điều khiển STM32F401 + Mạch nạp ST-Link', N'Kit STM32F4 Blackpill dùng thực hành môn Vi xử lý / Hệ thống nhúng khoa ĐTVT PTIT. Tặng kèm dây cáp, mạch nạp ST-Link và code mẫu Keil C.', 250000, 'New', 'Sell', NULL, N'Phòng Lab Viễn thông - Nhà A3 PTIT', 'Active', NULL, 64, 0, SYSUTCDATETIME(), SYSUTCDATETIME());
    
    DECLARE @p1 INT = SCOPE_IDENTITY();
    INSERT INTO dbo.ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
    VALUES (@p1, '/uploads/seed/p03.png', 1, 1, SYSUTCDATETIME());
END;

-- Board Arduino Uno R3
IF NOT EXISTS (SELECT 1 FROM dbo.Products WHERE Title LIKE N'%Arduino Uno R3%')
BEGIN
    INSERT INTO dbo.Products (UserId, CategoryId, UniversityId, Title, Description, Price, [Condition], TransactionType, DesiredExchange, Location, Status, ModerationNote, ViewCount, IsDeleted, CreatedAt, UpdatedAt)
    VALUES (7, 3, 4, N'Board Arduino Uno R3 + Bộ cảm biến thực hành IoT PTIT', N'Combo gồm board Arduino Uno R3, test board cắm dây, cảm biến nhiệt độ DHT11, cảm biến khoảng cách siêu âm, màn hình LCD 1602 I2C phục vụ môn Đồ án cơ sở & IoT.', 160000, 'New', 'Sell', NULL, N'Ký túc xá B4 PTIT - Cơ sở Hà Đông', 'Active', NULL, 48, 0, SYSUTCDATETIME(), SYSUTCDATETIME());

    DECLARE @p3 INT = SCOPE_IDENTITY();
    INSERT INTO dbo.ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
    VALUES (@p3, '/uploads/seed/p04.png', 1, 1, SYSUTCDATETIME());
END;

-- Bàn phím cơ Akko 3087
IF NOT EXISTS (SELECT 1 FROM dbo.Products WHERE Title LIKE N'%Akko 3087%')
BEGIN
    INSERT INTO dbo.Products (UserId, CategoryId, UniversityId, Title, Description, Price, [Condition], TransactionType, DesiredExchange, Location, Status, ModerationNote, ViewCount, IsDeleted, CreatedAt, UpdatedAt)
    VALUES (7, 3, 4, N'Bàn phím cơ Akko 3087 switch Orange gõ code PTIT', N'Bàn phím cơ gõ êm mượt, không ồn phòng ký túc xá, keycap PBT không bóng mờ, cực hợp anh em sinh viên IT lập trình đêm.', 480000, 'Good', 'Sell', NULL, N'Cổng trường PTIT - Km10 Nguyễn Trãi', 'Active', NULL, 76, 0, SYSUTCDATETIME(), SYSUTCDATETIME());

    DECLARE @p6 INT = SCOPE_IDENTITY();
    INSERT INTO dbo.ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
    VALUES (@p6, '/uploads/seed/p13.png', 1, 1, SYSUTCDATETIME());
END;

-- Giáo trình An toàn thông tin & Mật mã học
IF NOT EXISTS (SELECT 1 FROM dbo.Products WHERE Title LIKE N'%An toàn thông tin & Mật mã học%')
BEGIN
    INSERT INTO dbo.Products (UserId, CategoryId, UniversityId, Title, Description, Price, [Condition], TransactionType, DesiredExchange, Location, Status, ModerationNote, ViewCount, IsDeleted, CreatedAt, UpdatedAt)
    VALUES (5, 2, 4, N'Giáo trình An toàn thông tin & Mật mã học (Khoa ATTT - PTIT)', N'Tài liệu môn Cơ sở an toàn thông tin & mật mã học cổ điển/hiện đại (AES, RSA, ECC). Tặng kèm file slide và đề cương ôn tập.', 35000, 'New', 'Sell', NULL, N'Giảng đường A2 PTIT', 'Active', NULL, 67, 0, SYSUTCDATETIME(), SYSUTCDATETIME());

    DECLARE @p8 INT = SCOPE_IDENTITY();
    INSERT INTO dbo.ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
    VALUES (@p8, '/uploads/seed/p01.png', 1, 1, SYSUTCDATETIME());
END;

-- Giáo trình Mạng máy tính & CCNA
IF NOT EXISTS (SELECT 1 FROM dbo.Products WHERE Title LIKE N'%Mạng máy tính & CCNA%')
BEGIN
    INSERT INTO dbo.Products (UserId, CategoryId, UniversityId, Title, Description, Price, [Condition], TransactionType, DesiredExchange, Location, Status, ModerationNote, ViewCount, IsDeleted, CreatedAt, UpdatedAt)
    VALUES (4, 2, 4, N'Giáo trình Mạng máy tính & CCNA Routing & Switching PTIT', N'Giáo trình Mạng máy tính chuẩn khoa CNTT & ATTT PTIT, tổng hợp lý thuyết mô hình OSI, TCP/IP, kèm bài tập chia IP subnetting và bài thực hành Cisco Packet Tracer.', 30000, 'Good', 'Sell', NULL, N'Thư viện PTIT - Nhà A1', 'Active', NULL, 58, 0, SYSUTCDATETIME(), SYSUTCDATETIME());

    DECLARE @p10 INT = SCOPE_IDENTITY();
    INSERT INTO dbo.ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
    VALUES (@p10, '/uploads/seed/p02.png', 1, 1, SYSUTCDATETIME());
END;

-- Bàn học gấp gọn sinh viên + Đèn LED chống cận KTX B1
IF NOT EXISTS (SELECT 1 FROM dbo.Products WHERE Title LIKE N'%Bàn học gấp gọn sinh viên%')
BEGIN
    INSERT INTO dbo.Products (UserId, CategoryId, UniversityId, Title, Description, Price, [Condition], TransactionType, DesiredExchange, Location, Status, ModerationNote, ViewCount, IsDeleted, CreatedAt, UpdatedAt)
    VALUES (6, 5, 4, N'Bàn học gấp gọn sinh viên chân sắt + Đèn LED chống cận', N'Bàn học ngồi giường KTX có khe để iPad và cốc nước, kèm đèn LED để bàn bảo vệ mắt cắm cổng USB rất tiện lợi cho các bạn ở KTX PTIT.', 110000, 'Good', 'Sell', NULL, N'Ký túc xá B1 PTIT Hà Đông', 'Active', NULL, 62, 0, SYSUTCDATETIME(), SYSUTCDATETIME());

    DECLARE @p11 INT = SCOPE_IDENTITY();
    INSERT INTO dbo.ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
    VALUES (@p11, '/uploads/seed/p11.png', 1, 1, SYSUTCDATETIME());
END;

-- Nồi cơm điện Sunhouse 1.2L Triều Khúc
IF NOT EXISTS (SELECT 1 FROM dbo.Products WHERE Title LIKE N'%Nồi cơm điện Sunhouse 1.2L%')
BEGIN
    INSERT INTO dbo.Products (UserId, CategoryId, UniversityId, Title, Description, Price, [Condition], TransactionType, DesiredExchange, Location, Status, ModerationNote, ViewCount, IsDeleted, CreatedAt, UpdatedAt)
    VALUES (3, 5, 4, N'Nồi cơm điện Sunhouse 1.2L cho sinh viên trọ Triều Khúc', N'Nồi cơm điện lòng chống dính còn rất tốt, nấu cơm dẻo nhanh, phù hợp cho 2-3 bạn sinh viên nấu ăn chung tiết kiệm chi phí.', 140000, 'Good', 'Sell', NULL, N'Ngõ 66 Triều Khúc (cách PTIT 400m)', 'Active', NULL, 43, 0, SYSUTCDATETIME(), SYSUTCDATETIME());

    DECLARE @p12 INT = SCOPE_IDENTITY();
    INSERT INTO dbo.ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
    VALUES (@p12, '/uploads/seed/p06.png', 1, 1, SYSUTCDATETIME());
END;

-- Áo polo thể dục PTIT size M
IF NOT EXISTS (SELECT 1 FROM dbo.Products WHERE Title LIKE N'%Áo polo thể dục PTIT%')
BEGIN
    INSERT INTO dbo.Products (UserId, CategoryId, UniversityId, Title, Description, Price, [Condition], TransactionType, DesiredExchange, Location, Status, ModerationNote, ViewCount, IsDeleted, CreatedAt, UpdatedAt)
    VALUES (2, 4, 4, N'Áo polo thể dục thể chất PTIT size M', N'Áo thể dục đồng phục PTIT chất vải co giãn thấm hút mồ hôi tốt, mình học xong môn thể chất nên nhượng lại giá rẻ cho các bạn khóa dưới.', 40000, 'Good', 'Sell', NULL, N'Sân bóng PTIT - Cạnh nhà ăn', 'Active', NULL, 39, 0, SYSUTCDATETIME(), SYSUTCDATETIME());

    DECLARE @p13 INT = SCOPE_IDENTITY();
    INSERT INTO dbo.ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
    VALUES (@p13, '/uploads/seed/p05.png', 1, 1, SYSUTCDATETIME());
END;
