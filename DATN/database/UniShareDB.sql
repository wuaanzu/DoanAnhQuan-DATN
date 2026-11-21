/* =====================================================================
   UniShareDB.sql
   N?n t?ng chia s? & trao d?i d? d�ng cu trong tru?ng d?i h?c � UniShare
   ---------------------------------------------------------------------
   - Ch?y du?c tr�n SQL Server 2017+ / SQL Server Express / LocalDB
   - C� th? ch?y trong SSMS (F5) ho?c sqlcmd:
       sqlcmd -S .\SQLEXPRESS -E -i database\UniShareDB.sql -f 65001
       sqlcmd -S "(localdb)\MSSQLLocalDB" -E -i database\UniShareDB.sql -f 65001
   - Script AN TO�N KHI CH?Y L?I (idempotent):
       * Ch? t?o database / b?ng / ch? m?c n?u chua t?n t?i
       * Ch? ch�n d? li?u m?u khi b?ng tuong ?ng dang tr?ng
       => Kh�ng bao gi? ghi d� d? li?u th?t d� c�.
   - T�i kho?n demo (m?t kh?u chung: Unishare@123) � �?I M?T KH?U khi tri?n khai th?t:
       admin@unishare.vn            (Admin)
       anh.nm210001@sis.hust.edu.vn (Sinh vi�n)
       ha.tt@vnu.edu.vn             (Sinh vi�n)
       nam.lh@st.neu.edu.vn         (Sinh vi�n)
       bao.pg@stu.ptit.edu.vn       (Sinh vi�n)
       linh.vn@ftu.edu.vn         (Sinh vi�n)
   ===================================================================== */

SET NOCOUNT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;   -- b?t bu?c cho filtered index (sqlcmd m?c d?nh OFF)
GO

/* ---------------------------------------------------------------------
   1. DATABASE
   --------------------------------------------------------------------- */
IF DB_ID(N'UniShareDB') IS NULL
BEGIN
    PRINT N'>> T?o database UniShareDB';
    CREATE DATABASE UniShareDB COLLATE Vietnamese_CI_AS;
END
ELSE
    PRINT N'>> Database UniShareDB d� t?n t?i � b? qua bu?c t?o';
GO

USE UniShareDB;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

/* ---------------------------------------------------------------------
   2. TABLES
   Ch�nh s�ch x�a d? li?u:
   - Users: KH�NG x�a c?ng � d�ng Status = 'Locked'.
   - Products: x�a m?m (IsDeleted = 1) d? gi? l?ch s? giao d?ch/d�nh gi�.
   - ProductImages, Favorites: CASCADE theo Products (d? li?u ph? thu?c).
   - Messages: CASCADE theo Conversations.
   - Transactions, Reviews, Reports: NO ACTION � kh�ng cho x�a nh?m l?ch s?.
   --------------------------------------------------------------------- */

-- 2.1 Universities ------------------------------------------------------
IF OBJECT_ID(N'dbo.Universities', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Universities (
        UniversityId    INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Universities PRIMARY KEY,
        UniversityName  NVARCHAR(200)     NOT NULL,
        ShortName       NVARCHAR(30)      NULL,
        Address         NVARCHAR(300)     NULL,
        EmailDomain     VARCHAR(100)      NULL,
        CreatedAt       DATETIME2(0)      NOT NULL CONSTRAINT DF_Universities_CreatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_Universities_Name UNIQUE (UniversityName)
    );
END
GO

-- 2.2 Categories --------------------------------------------------------
IF OBJECT_ID(N'dbo.Categories', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Categories (
        CategoryId      INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Categories PRIMARY KEY,
        CategoryName    NVARCHAR(100)     NOT NULL,
        Description     NVARCHAR(500)     NULL,
        Icon            VARCHAR(50)       NULL,          -- t�n icon Lucide hi?n th? ? frontend
        SortOrder       INT               NOT NULL CONSTRAINT DF_Categories_SortOrder DEFAULT 0,
        Status          VARCHAR(20)       NOT NULL CONSTRAINT DF_Categories_Status DEFAULT 'Active',
        CreatedAt       DATETIME2(0)      NOT NULL CONSTRAINT DF_Categories_CreatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_Categories_Name UNIQUE (CategoryName),
        CONSTRAINT CK_Categories_Status CHECK (Status IN ('Active', 'Hidden'))
    );
END
GO

-- 2.3 Users -------------------------------------------------------------
IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users (
        UserId          INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Users PRIMARY KEY,
        FullName        NVARCHAR(100)     NOT NULL,
        StudentCode     VARCHAR(30)       NOT NULL,
        Email           VARCHAR(150)      NOT NULL,
        PasswordHash    VARCHAR(255)      NOT NULL,      -- bcrypt hash, KH�NG luu m?t kh?u thu?n
        Avatar          NVARCHAR(500)     NULL,
        UniversityId    INT               NULL,
        Phone           VARCHAR(20)       NULL,
        Location        NVARCHAR(200)     NULL,          -- khu v?c giao d?ch m?c d?nh
        Bio             NVARCHAR(500)     NULL,
        Role            VARCHAR(20)       NOT NULL CONSTRAINT DF_Users_Role DEFAULT 'Student',
        Status          VARCHAR(20)       NOT NULL CONSTRAINT DF_Users_Status DEFAULT 'Active',
        IsEmailVerified BIT               NOT NULL CONSTRAINT DF_Users_IsEmailVerified DEFAULT 0,
        TokenVersion    INT               NOT NULL CONSTRAINT DF_Users_TokenVersion DEFAULT 0, -- tang khi d?i m?t kh?u => v� hi?u JWT cu
        LastLoginAt     DATETIME2(0)      NULL,
        CreatedAt       DATETIME2(0)      NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt       DATETIME2(0)      NOT NULL CONSTRAINT DF_Users_UpdatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_Users_Email       UNIQUE (Email),
        CONSTRAINT UQ_Users_StudentCode UNIQUE (StudentCode),
        CONSTRAINT FK_Users_Universities FOREIGN KEY (UniversityId) REFERENCES dbo.Universities(UniversityId),
        CONSTRAINT CK_Users_Role   CHECK (Role IN ('Student', 'Admin')),
        CONSTRAINT CK_Users_Status CHECK (Status IN ('Active', 'Locked')),
        CONSTRAINT CK_Users_StudentUniversity CHECK (Role = 'Admin' OR UniversityId IS NOT NULL)
    );
    CREATE INDEX IX_Users_UniversityId ON dbo.Users(UniversityId);
    CREATE INDEX IX_Users_Role_Status  ON dbo.Users(Role, Status);
END
GO

-- 2.4 Products ----------------------------------------------------------
IF OBJECT_ID(N'dbo.Products', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Products (
        ProductId       INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Products PRIMARY KEY,
        UserId          INT               NOT NULL,
        CategoryId      INT               NOT NULL,
        UniversityId    INT               NOT NULL,
        Title           NVARCHAR(150)     NOT NULL,
        Description     NVARCHAR(4000)    NOT NULL,
        Price           DECIMAL(12,0)     NOT NULL CONSTRAINT DF_Products_Price DEFAULT 0,
        [Condition]     VARCHAR(20)       NOT NULL,
        TransactionType VARCHAR(20)       NOT NULL,
        DesiredExchange NVARCHAR(300)     NULL,
        Location        NVARCHAR(200)     NOT NULL,
        Status          VARCHAR(20)       NOT NULL CONSTRAINT DF_Products_Status DEFAULT 'Pending',
        ModerationNote  NVARCHAR(500)     NULL,          -- l� do t? ch?i / ?n c?a qu?n tr? vi�n
        ViewCount       INT               NOT NULL CONSTRAINT DF_Products_ViewCount DEFAULT 0,
        IsDeleted       BIT               NOT NULL CONSTRAINT DF_Products_IsDeleted DEFAULT 0,
        DeletedAt       DATETIME2(0)      NULL,
        CreatedAt       DATETIME2(0)      NOT NULL CONSTRAINT DF_Products_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt       DATETIME2(0)      NOT NULL CONSTRAINT DF_Products_UpdatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Products_Users        FOREIGN KEY (UserId)       REFERENCES dbo.Users(UserId),
        CONSTRAINT FK_Products_Categories   FOREIGN KEY (CategoryId)   REFERENCES dbo.Categories(CategoryId),
        CONSTRAINT FK_Products_Universities FOREIGN KEY (UniversityId) REFERENCES dbo.Universities(UniversityId),
        CONSTRAINT CK_Products_Price       CHECK (Price >= 0),
        CONSTRAINT CK_Products_FreePrice   CHECK (TransactionType <> 'Free' OR Price = 0),
        CONSTRAINT CK_Products_Condition   CHECK ([Condition] IN ('New', 'Good', 'Used', 'NeedsRepair')),
        CONSTRAINT CK_Products_TransType   CHECK (TransactionType IN ('Sell', 'Exchange', 'Free')),
        CONSTRAINT CK_Products_Status      CHECK (Status IN ('Pending', 'Active', 'Completed', 'Rejected', 'Hidden')),
        CONSTRAINT CK_Products_ViewCount   CHECK (ViewCount >= 0)
    );
    CREATE INDEX IX_Products_Title        ON dbo.Products(Title);
    CREATE INDEX IX_Products_CategoryId   ON dbo.Products(CategoryId);
    CREATE INDEX IX_Products_UserId       ON dbo.Products(UserId);
    CREATE INDEX IX_Products_UniversityId ON dbo.Products(UniversityId);
    CREATE INDEX IX_Products_Status_CreatedAt ON dbo.Products(Status, IsDeleted, CreatedAt DESC) INCLUDE (Price, TransactionType, CategoryId);
    CREATE INDEX IX_Products_CreatedAt    ON dbo.Products(CreatedAt DESC);
    CREATE INDEX IX_Products_Price        ON dbo.Products(Price);
END
GO

-- 2.5 ProductImages -----------------------------------------------------
IF OBJECT_ID(N'dbo.ProductImages', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ProductImages (
        ImageId         INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ProductImages PRIMARY KEY,
        ProductId       INT               NOT NULL,
        ImageUrl        NVARCHAR(500)     NOT NULL,
        IsPrimary       BIT               NOT NULL CONSTRAINT DF_ProductImages_IsPrimary DEFAULT 0,
        SortOrder       INT               NOT NULL CONSTRAINT DF_ProductImages_SortOrder DEFAULT 0,
        CreatedAt       DATETIME2(0)      NOT NULL CONSTRAINT DF_ProductImages_CreatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_ProductImages_Products FOREIGN KEY (ProductId) REFERENCES dbo.Products(ProductId) ON DELETE CASCADE
    );
    CREATE INDEX IX_ProductImages_ProductId ON dbo.ProductImages(ProductId, SortOrder);
    -- M?i s?n ph?m ch? c� t?i da 1 ?nh d?i di?n
    CREATE UNIQUE INDEX UX_ProductImages_Primary ON dbo.ProductImages(ProductId) WHERE IsPrimary = 1;
END
GO

-- 2.6 Favorites (b?ng trung gian nhi?u-nhi?u Users <-> Products) -------
IF OBJECT_ID(N'dbo.Favorites', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Favorites (
        FavoriteId      INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Favorites PRIMARY KEY,
        UserId          INT               NOT NULL,
        ProductId       INT               NOT NULL,
        CreatedAt       DATETIME2(0)      NOT NULL CONSTRAINT DF_Favorites_CreatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_Favorites_User_Product UNIQUE (UserId, ProductId),
        CONSTRAINT FK_Favorites_Users    FOREIGN KEY (UserId)    REFERENCES dbo.Users(UserId),
        CONSTRAINT FK_Favorites_Products FOREIGN KEY (ProductId) REFERENCES dbo.Products(ProductId) ON DELETE CASCADE
    );
    CREATE INDEX IX_Favorites_ProductId ON dbo.Favorites(ProductId);
END
GO

-- 2.7 Transactions ------------------------------------------------------
IF OBJECT_ID(N'dbo.Transactions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Transactions (
        TransactionId     INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Transactions PRIMARY KEY,
        ProductId         INT               NOT NULL,
        SellerId          INT               NOT NULL,
        BuyerId           INT               NOT NULL,
        TransactionType   VARCHAR(20)       NOT NULL,
        ProposedProductId INT               NULL,
        Message           NVARCHAR(1000)    NULL,
        MeetingPlace      NVARCHAR(200)     NULL,
        MeetingTime       DATETIME2(0)      NULL,
        SellerNote        NVARCHAR(500)     NULL,
        Status            VARCHAR(20)       NOT NULL CONSTRAINT DF_Transactions_Status DEFAULT 'Pending',
        CreatedAt         DATETIME2(0)      NOT NULL CONSTRAINT DF_Transactions_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt         DATETIME2(0)      NOT NULL CONSTRAINT DF_Transactions_UpdatedAt DEFAULT SYSUTCDATETIME(),
        RespondedAt       DATETIME2(0)      NULL,
        CompletedAt       DATETIME2(0)      NULL,
        CONSTRAINT FK_Transactions_Products FOREIGN KEY (ProductId)         REFERENCES dbo.Products(ProductId),
        CONSTRAINT FK_Transactions_Proposed FOREIGN KEY (ProposedProductId) REFERENCES dbo.Products(ProductId),
        CONSTRAINT FK_Transactions_Seller   FOREIGN KEY (SellerId)          REFERENCES dbo.Users(UserId),
        CONSTRAINT FK_Transactions_Buyer    FOREIGN KEY (BuyerId)           REFERENCES dbo.Users(UserId),
        CONSTRAINT CK_Transactions_Parties  CHECK (SellerId <> BuyerId),
        CONSTRAINT CK_Transactions_Type     CHECK (TransactionType IN ('Sell', 'Exchange', 'Free')),
        CONSTRAINT CK_Transactions_Status   CHECK (Status IN ('Pending', 'Accepted', 'Rejected', 'Cancelled', 'Completed')),
        CONSTRAINT CK_Transactions_Completed CHECK (Status <> 'Completed' OR CompletedAt IS NOT NULL)
    );
    CREATE INDEX IX_Transactions_ProductId     ON dbo.Transactions(ProductId);
    CREATE INDEX IX_Transactions_Seller_Status ON dbo.Transactions(SellerId, Status, CreatedAt DESC);
    CREATE INDEX IX_Transactions_Buyer_Status  ON dbo.Transactions(BuyerId, Status, CreatedAt DESC);
    -- M?t ngu?i mua ch? c� t?i da 1 y�u c?u dang m? (Pending/Accepted) cho m?i s?n ph?m
    CREATE UNIQUE INDEX UX_Transactions_OpenRequest ON dbo.Transactions(ProductId, BuyerId)
        WHERE Status IN ('Pending', 'Accepted');
END
GO

-- 2.8 Conversations -----------------------------------------------------
IF OBJECT_ID(N'dbo.Conversations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Conversations (
        ConversationId  INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Conversations PRIMARY KEY,
        User1Id         INT               NOT NULL,      -- lu�n l� Id nh? hon
        User2Id         INT               NOT NULL,      -- lu�n l� Id l?n hon
        ProductId       INT               NULL,
        CreatedAt       DATETIME2(0)      NOT NULL CONSTRAINT DF_Conversations_CreatedAt DEFAULT SYSUTCDATETIME(),
        LastMessageAt   DATETIME2(0)      NULL,
        CONSTRAINT FK_Conversations_User1    FOREIGN KEY (User1Id)   REFERENCES dbo.Users(UserId),
        CONSTRAINT FK_Conversations_User2    FOREIGN KEY (User2Id)   REFERENCES dbo.Users(UserId),
        CONSTRAINT FK_Conversations_Products FOREIGN KEY (ProductId) REFERENCES dbo.Products(ProductId),
        CONSTRAINT CK_Conversations_Order    CHECK (User1Id < User2Id),
        CONSTRAINT UQ_Conversations_Pair     UNIQUE (User1Id, User2Id, ProductId)
    );
    CREATE INDEX IX_Conversations_User2 ON dbo.Conversations(User2Id);
END
GO

-- 2.9 Messages ----------------------------------------------------------
IF OBJECT_ID(N'dbo.Messages', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Messages (
        MessageId       INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Messages PRIMARY KEY,
        ConversationId  INT               NOT NULL,
        SenderId        INT               NOT NULL,
        Content         NVARCHAR(2000)    NOT NULL,
        SentAt          DATETIME2(3)      NOT NULL CONSTRAINT DF_Messages_SentAt DEFAULT SYSUTCDATETIME(),
        IsRead          BIT               NOT NULL CONSTRAINT DF_Messages_IsRead DEFAULT 0,
        ReadAt          DATETIME2(0)      NULL,
        CONSTRAINT FK_Messages_Conversations FOREIGN KEY (ConversationId) REFERENCES dbo.Conversations(ConversationId) ON DELETE CASCADE,
        CONSTRAINT FK_Messages_Users         FOREIGN KEY (SenderId)       REFERENCES dbo.Users(UserId),
        CONSTRAINT CK_Messages_Content       CHECK (LEN(Content) > 0)
    );
    CREATE INDEX IX_Messages_Conversation_SentAt ON dbo.Messages(ConversationId, SentAt DESC);
    CREATE INDEX IX_Messages_Unread ON dbo.Messages(ConversationId, IsRead) INCLUDE (SenderId);
END
GO

-- 2.10 Notifications ----------------------------------------------------
IF OBJECT_ID(N'dbo.Notifications', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Notifications (
        NotificationId  INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Notifications PRIMARY KEY,
        UserId          INT               NOT NULL,
        Title           NVARCHAR(200)     NOT NULL,
        Content         NVARCHAR(1000)    NULL,
        Type            VARCHAR(30)       NOT NULL,
        RelatedId       INT               NULL,
        Link            NVARCHAR(300)     NULL,          -- du?ng d?n frontend khi b?m v�o th�ng b�o
        IsRead          BIT               NOT NULL CONSTRAINT DF_Notifications_IsRead DEFAULT 0,
        CreatedAt       DATETIME2(0)      NOT NULL CONSTRAINT DF_Notifications_CreatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Notifications_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId),
        CONSTRAINT CK_Notifications_Type  CHECK (Type IN ('Transaction', 'Message', 'Review', 'Report', 'Product', 'System'))
    );
    CREATE INDEX IX_Notifications_User ON dbo.Notifications(UserId, IsRead, CreatedAt DESC);
END
GO

-- 2.11 Reviews ----------------------------------------------------------
IF OBJECT_ID(N'dbo.Reviews', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Reviews (
        ReviewId        INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Reviews PRIMARY KEY,
        TransactionId   INT               NOT NULL,
        ReviewerId      INT               NOT NULL,
        RevieweeId      INT               NOT NULL,
        Rating          TINYINT           NOT NULL,
        Comment         NVARCHAR(1000)    NULL,
        CreatedAt       DATETIME2(0)      NOT NULL CONSTRAINT DF_Reviews_CreatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Reviews_Transactions FOREIGN KEY (TransactionId) REFERENCES dbo.Transactions(TransactionId),
        CONSTRAINT FK_Reviews_Reviewer     FOREIGN KEY (ReviewerId)    REFERENCES dbo.Users(UserId),
        CONSTRAINT FK_Reviews_Reviewee     FOREIGN KEY (RevieweeId)    REFERENCES dbo.Users(UserId),
        CONSTRAINT CK_Reviews_Rating       CHECK (Rating BETWEEN 1 AND 5),
        CONSTRAINT CK_Reviews_Parties      CHECK (ReviewerId <> RevieweeId),
        CONSTRAINT UQ_Reviews_Transaction_Reviewer UNIQUE (TransactionId, ReviewerId)
    );
    CREATE INDEX IX_Reviews_RevieweeId ON dbo.Reviews(RevieweeId, CreatedAt DESC);
END
GO

-- 2.12 Reports ----------------------------------------------------------
IF OBJECT_ID(N'dbo.Reports', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Reports (
        ReportId        INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Reports PRIMARY KEY,
        ReporterId      INT               NOT NULL,
        ProductId       INT               NULL,
        ReportedUserId  INT               NULL,
        Reason          NVARCHAR(100)     NOT NULL,
        Description     NVARCHAR(1000)    NULL,
        Status          VARCHAR(20)       NOT NULL CONSTRAINT DF_Reports_Status DEFAULT 'Pending',
        AdminNote       NVARCHAR(500)     NULL,
        ResolvedBy      INT               NULL,
        CreatedAt       DATETIME2(0)      NOT NULL CONSTRAINT DF_Reports_CreatedAt DEFAULT SYSUTCDATETIME(),
        ResolvedAt      DATETIME2(0)      NULL,
        CONSTRAINT FK_Reports_Reporter     FOREIGN KEY (ReporterId)     REFERENCES dbo.Users(UserId),
        CONSTRAINT FK_Reports_ReportedUser FOREIGN KEY (ReportedUserId) REFERENCES dbo.Users(UserId),
        CONSTRAINT FK_Reports_ResolvedBy   FOREIGN KEY (ResolvedBy)     REFERENCES dbo.Users(UserId),
        CONSTRAINT FK_Reports_Products     FOREIGN KEY (ProductId)      REFERENCES dbo.Products(ProductId),
        CONSTRAINT CK_Reports_Target CHECK (ProductId IS NOT NULL OR ReportedUserId IS NOT NULL),
        CONSTRAINT CK_Reports_Status CHECK (Status IN ('Pending', 'Resolved', 'Rejected'))
    );
    CREATE INDEX IX_Reports_Status ON dbo.Reports(Status, CreatedAt DESC);
END
GO

-- 2.13 PasswordResetTokens ---------------------------------------------
IF OBJECT_ID(N'dbo.PasswordResetTokens', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PasswordResetTokens (
        TokenId         INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_PasswordResetTokens PRIMARY KEY,
        UserId          INT               NOT NULL,
        TokenHash       CHAR(64)          NOT NULL,      -- SHA-256 c?a token, KH�NG luu token g?c
        ExpiresAt       DATETIME2(0)      NOT NULL,
        UsedAt          DATETIME2(0)      NULL,
        CreatedAt       DATETIME2(0)      NOT NULL CONSTRAINT DF_PasswordResetTokens_CreatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_PasswordResetTokens_Hash UNIQUE (TokenHash),
        CONSTRAINT FK_PasswordResetTokens_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId)
    );
    CREATE INDEX IX_PasswordResetTokens_UserId ON dbo.PasswordResetTokens(UserId);
END
GO

-- 2.14 SiteContents (n?i dung tinh & quy d?nh c?ng d?ng do Admin qu?n l�)
IF OBJECT_ID(N'dbo.SiteContents', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SiteContents (
        ContentId       INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_SiteContents PRIMARY KEY,
        Slug            VARCHAR(80)       NOT NULL,
        Title           NVARCHAR(200)     NOT NULL,
        Body            NVARCHAR(MAX)     NOT NULL,
        UpdatedBy       INT               NULL,
        UpdatedAt       DATETIME2(0)      NOT NULL CONSTRAINT DF_SiteContents_UpdatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_SiteContents_Slug UNIQUE (Slug),
        CONSTRAINT FK_SiteContents_Users FOREIGN KEY (UpdatedBy) REFERENCES dbo.Users(UserId)
    );
END
GO

/* ---------------------------------------------------------------------
   3. REFERENCE DATA (ch? ch�n khi b?ng tr?ng)
   --------------------------------------------------------------------- */
IF NOT EXISTS (SELECT 1 FROM dbo.Universities)
BEGIN
    PRINT N'>> Ch�n d? li?u Universities';
    SET IDENTITY_INSERT dbo.Universities ON;
    INSERT INTO dbo.Universities (UniversityId, UniversityName, ShortName, Address, EmailDomain) VALUES
    (1, N'�?i h?c B�ch khoa H� N?i',                         N'HUST',  N'S? 1 �?i C? Vi?t, Hai B� Trung, H� N?i',     'sis.hust.edu.vn'),
    (2, N'Tru?ng �?i h?c C�ng ngh? - �HQG H� N?i',           N'UET',   N'144 Xu�n Th?y, C?u Gi?y, H� N?i',             'vnu.edu.vn'),
    (3, N'�?i h?c Kinh t? Qu?c d�n',                         N'NEU',   N'207 Gi?i Ph�ng, Hai B� Trung, H� N?i',        'st.neu.edu.vn'),
    (4, N'H?c vi?n C�ng ngh? Buu ch�nh Vi?n th�ng',          N'PTIT',  N'Km10 Nguy?n Tr�i, H� ��ng, H� N?i',           'stu.ptit.edu.vn'),
    (5, N'Tru?ng �?i h?c Ngo?i thuong', N'FTU', N'91 Ch�a L�ng, L�ng Thu?ng, �?ng �a, H� N?i', 'ftu.edu.vn'),
    (6, N'Tru?ng �?i h?c Thuong m?i', N'TMU', N'79 H? T�ng M?u, Mai D?ch, C?u Gi?y, H� N?i', 'tmu.edu.vn'),
    (7, N'Tru?ng �?i h?c Su ph?m H� N?i',                    N'HNUE',  N'136 Xu�n Th?y, C?u Gi?y, H� N?i',             'hnue.edu.vn'),
    (8, N'Tru?ng �?i h?c Th?y l?i',                          N'TLU',   N'175 T�y Son, �?ng �a, H� N?i',                'e.tlu.edu.vn');
    SET IDENTITY_INSERT dbo.Universities OFF;
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Categories)
BEGIN
    PRINT N'>> Ch�n d? li?u Categories';
    SET IDENTITY_INSERT dbo.Categories ON;
    INSERT INTO dbo.Categories (CategoryId, CategoryName, Description, Icon, SortOrder, Status) VALUES
    (1, N'S�ch',             N'S�ch tham kh?o, s�ch k? nang, ti?u thuy?t, ngo?i ng?',     'BookOpen',      1, 'Active'),
    (2, N'Gi�o tr�nh',       N'Gi�o tr�nh, d? cuong, t�i li?u m�n h?c',                     'GraduationCap', 2, 'Active'),
    (3, N'�? di?n t?',       N'Laptop, di?n tho?i, tai nghe, thi?t b? di?n t?',             'Laptop',        3, 'Active'),
    (4, N'Qu?n �o',          N'Qu?n �o, d?ng ph?c, gi�y d�p',                                'Shirt',         4, 'Active'),
    (5, N'�? gia d?ng',      N'N?i com, qu?t, d�n, v?t d?ng ph�ng tr? / k� t�c x�',          'CookingPot',    5, 'Active'),
    (6, N'�? d�ng h?c t?p',  N'M�y t�nh c?m tay, d?ng c? v?, van ph�ng ph?m',                'PencilRuler',   6, 'Active'),
    (7, N'Ph? ki?n',         N'Balo, t�i x�ch, ph? ki?n c�ng ngh?',                          'Backpack',      7, 'Active'),
    (8, N'Kh�c',             N'C�c m�n d? kh�c: xe d?p, nh?c c?, d? th? thao...',             'Package',       8, 'Active');
    SET IDENTITY_INSERT dbo.Categories OFF;
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.SiteContents)
BEGIN
    PRINT N'>> Ch�n d? li?u SiteContents';
    INSERT INTO dbo.SiteContents (Slug, Title, Body) VALUES
    ('gioi-thieu', N'Gi?i thi?u v? UniShare',
     N'UniShare l� n?n t?ng chia s? v� trao d?i d? d�ng cu d�nh ri�ng cho c?ng d?ng sinh vi�n.
## S? m?nh
Gi�p sinh vi�n ti?t ki?m chi ph�, t�i s? d?ng d? d�ng v� x�y d?ng m�i tru?ng h?c t?p xanh.
## Gi� tr? c?t l�i
- Ti?t ki?m: mua l?i d? cu v?i gi� h?p l� ho?c nh?n mi?n ph�.
- K?t n?i: giao d?ch an to�n v?i b?n b� c�ng tru?ng.
- B?n v?ng: gi?m r�c th?i, lan t?a l?i s?ng xanh.'),
    ('huong-dan', N'Hu?ng d?n s? d?ng',
     N'## 1. �ang k� t�i kho?n
D�ng email sinh vi�n v� m� sinh vi�n d? t?o t�i kho?n.
## 2. �ang tin
Ch?n "�ang tin", di?n th�ng tin m�n d?, t?i ?nh r� n�t v� ch?n h�nh th?c: b�n, trao d?i ho?c t?ng mi?n ph�. Tin dang s? du?c qu?n tr? vi�n duy?t tru?c khi hi?n th?.
## 3. K?t n?i
G?i y�u c?u mua / d? ngh? trao d?i / dang k� nh?n d?, ho?c nh?n tin tr?c ti?p v?i ngu?i dang.
## 4. Giao d?ch
Ngu?i dang ch?p nh?n y�u c?u, hai b�n h?n d?a di?m trong khu�n vi�n tru?ng. Sau khi trao d?, ngu?i dang x�c nh?n ho�n th�nh.
## 5. ��nh gi�
Hai b�n d�nh gi� nhau d? x�y d?ng c?ng d?ng uy t�n.'),
    ('quy-dinh-cong-dong', N'Quy d?nh c?ng d?ng',
     N'## �u?c ph�p
- �ang b�n, trao d?i, t?ng d? d�ng c� nh�n h?p ph�p.
- M� t? trung th?c t�nh tr?ng s?n ph?m, ?nh ch?p th?t.
## Kh�ng du?c ph�p
- �ang h�ng c?m, h�ng gi?, h�ng kh�ng r� ngu?n g?c.
- �ang t�i li?u vi ph?m b?n quy?n, d? thi, b�i l�m h?.
- L?a d?o, y�u c?u chuy?n ti?n tru?c khi g?p m?t.
- Ng�n t? x�c ph?m, qu?y r?i th�nh vi�n kh�c.
## X? l� vi ph?m
Tin dang vi ph?m s? b? ?n; t�i kho?n vi ph?m nhi?u l?n s? b? kh�a.'),
    ('chinh-sach-bao-mat', N'Ch�nh s�ch b?o m?t',
     N'## D? li?u ch�ng t�i thu th?p
H? t�n, email sinh vi�n, m� sinh vi�n, tru?ng d?i h?c, s? di?n tho?i (t�y ch?n) v� n?i dung b?n dang t?i.
## C�ch ch�ng t�i b?o v? d? li?u
- M?t kh?u du?c m� h�a m?t chi?u b?ng bcrypt.
- Phi�n dang nh?p d�ng cookie HttpOnly, kh�ng th? d?c b?ng JavaScript.
- Email v� s? di?n tho?i kh�ng hi?n th? c�ng khai.
## Quy?n c?a b?n
B?n c� th? c?p nh?t th�ng tin c� nh�n b?t k? l�c n�o trong trang H? so.'),
    ('lien-he', N'Li�n h? & h? tr?',
     N'## H? tr? ngu?i d�ng
- Email: support@unishare.vn
- Hotline: 1900 0000 (8:00 - 17:00, th? 2 - th? 6)
## B�o c�o vi ph?m
D�ng n�t "B�o c�o" tr�n tin dang ho?c h? so ngu?i d�ng. �?i ngu qu?n tr? s? x? l� trong v�ng 24 gi?.'),
    ('meo-an-toan', N'M?o mua b�n an to�n',
     N'- H?n g?p ? noi d�ng ngu?i trong khu�n vi�n tru?ng: thu vi?n, cang tin, s?nh gi?ng du?ng.
- Ki?m tra k? m�n d? tru?c khi thanh to�n.
- Kh�ng chuy?n kho?n d?t c?c cho ngu?i l?.
- Trao d?i qua tin nh?n UniShare d? luu l?i l?ch s?.
- B�o c�o ngay khi ph�t hi?n d?u hi?u l?a d?o.');
END
GO

/* ---------------------------------------------------------------------
   4. DEMO DATA (ch? ch�n khi CHUA c� ngu?i d�ng n�o)
   M?t kh?u demo c?a t?t c? t�i kho?n: Unishare@123 (bcrypt cost 10)
   --------------------------------------------------------------------- */
IF NOT EXISTS (SELECT 1 FROM dbo.Users)
BEGIN
    PRINT N'>> Ch�n d? li?u demo (Users, Products, Transactions, ...)';
    DECLARE @pwd VARCHAR(255) = '$2b$10$wcVqv2Gk3Yh.PsStxkIUb.trWQILhUoX/CmhA1F6UN0CKTLlHYhFm';
    DECLARE @now DATETIME2(0) = SYSUTCDATETIME();

    -- Users ------------------------------------------------------------
    SET IDENTITY_INSERT dbo.Users ON;
    INSERT INTO dbo.Users (UserId, FullName, StudentCode, Email, PasswordHash, Avatar, UniversityId, Phone, Location, Bio, Role, Status, IsEmailVerified, CreatedAt, UpdatedAt) VALUES
    (1, N'Qu?n tr? vi�n UniShare', 'ADMIN001',   'admin@unishare.vn',            @pwd, NULL, NULL, NULL,         NULL,                              N'T�i kho?n qu?n tr? h? th?ng', 'Admin',   'Active', 1, DATEADD(DAY, -120, @now), @now),
    (2, N'Nguy?n Minh Anh',        '20210001',   'anh.nm210001@sis.hust.edu.vn', @pwd, NULL, 1,    '0912345678', N'KTX B�ch Khoa - Nh� B5',         N'Sinh vi�n nam 3 ng�nh Khoa h?c m�y t�nh', 'Student', 'Active', 1, DATEADD(DAY, -90, @now), @now),
    (3, N'Tr?n Thu H�',            '21020002',   'ha.tt@vnu.edu.vn',             @pwd, NULL, 2,    '0987654321', N'C?ng �H Qu?c gia, 144 Xu�n Th?y', N'M� d?c s�ch v� ch?y b?', 'Student', 'Active', 1, DATEADD(DAY, -75, @now), @now),
    (4, N'L� Ho�ng Nam',           '11203003',   'nam.lh@st.neu.edu.vn',         @pwd, NULL, 3,    NULL,         N'Thu vi?n NEU',                    NULL, 'Student', 'Active', 1, DATEADD(DAY, -60, @now), @now),
    (5, N'Ph?m Gia B?o',           'B21DCCN004', 'bao.pg@stu.ptit.edu.vn',       @pwd, NULL, 4,    '0903111222', N'Cang tin PTIT, Km10 Nguy?n Tr�i', N'Th�ch c�ng ngh?, hay d?i d? cu', 'Student', 'Active', 1, DATEADD(DAY, -45, @now), @now),
    (6, N'V� Ng?c Linh',           '2110005',    'linh.vn@ftu.edu.vn',         @pwd, NULL, 5,    NULL,         N'KTX khu A �HQG TP.HCM',           NULL, 'Student', 'Active', 1, DATEADD(DAY, -30, @now), @now);
    SET IDENTITY_INSERT dbo.Users OFF;

    -- Products ---------------------------------------------------------
    SET IDENTITY_INSERT dbo.Products ON;
    INSERT INTO dbo.Products (ProductId, UserId, CategoryId, UniversityId, Title, Description, Price, [Condition], TransactionType, DesiredExchange, Location, Status, ViewCount, CreatedAt, UpdatedAt) VALUES
    (1,  2, 2, 1, N'Gi�o tr�nh Gi?i t�ch 1 - NXB B�ch Khoa',
         N'Gi�o tr�nh Gi?i t�ch 1 b?n m?i nh?t, c� ghi ch� b�t ch� ? m?t s? chuong, kh�ng r�ch trang. Ph� h?p cho sinh vi�n nam nh?t c�c ng�nh k? thu?t.',
         35000, 'Good', 'Sell', NULL, N'Thu vi?n T? Quang B?u', 'Active', 56, DATEADD(DAY, -1, @now), DATEADD(DAY, -1, @now)),
    (2,  3, 1, 2, N'S�ch Clean Code (b?n ti?ng Vi?t)',
         N'S�ch Clean Code c?a Robert C. Martin, b?n d?ch ti?ng Vi?t. �� d?c xong, s�ch c�n d?p kho?ng 90%. Mu?n d?i l?y s�ch l?p tr�nh kh�c.',
         0, 'Good', 'Exchange', N'S�ch Design Patterns ho?c Refactoring', N'C?ng tru?ng �H C�ng ngh?', 'Active', 41, DATEADD(DAY, -2, @now), DATEADD(DAY, -2, @now)),
    (3,  4, 3, 3, N'Laptop Dell Latitude 7490 i5/8GB/256GB',
         N'Laptop Dell Latitude 7490, Core i5 th? h? 8, RAM 8GB, SSD 256GB, m�n 14 inch Full HD. Pin d�ng kho?ng 3 ti?ng, c� v�i v?t xu?c nh? ? n?p. T?ng k�m s?c zin.',
         5500000, 'Used', 'Sell', NULL, N'Thu vi?n NEU', 'Active', 132, DATEADD(DAY, -3, @now), DATEADD(DAY, -3, @now)),
    (4,  5, 3, 4, N'Tai nghe Bluetooth Sony WH-CH520',
         N'Tai nghe ch?p tai Sony WH-CH520, pin 40 gi?, k?t n?i ?n d?nh. Mua du?c 6 th�ng, c�n h?p v� c�p s?c.',
         450000, 'Good', 'Sell', NULL, N'Cang tin PTIT', 'Active', 77, DATEADD(DAY, -4, @now), DATEADD(DAY, -4, @now)),
    (5,  2, 4, 1, N'�o kho�c d?ng ph?c khoa CNTT size L',
         N'�o kho�c d?ng ph?c khoa, size L, m?c v�i l?n n�n c�n r?t m?i. T?ng mi?n ph� cho b?n n�o c?n.',
         0, 'Good', 'Free', NULL, N'KTX B�ch Khoa - Nh� B5', 'Active', 38, DATEADD(DAY, -1, @now), DATEADD(DAY, -1, @now)),
    (6,  6, 5, 5, N'N?i com di?n mini 1L',
         N'N?i com di?n mini 1 l�t, ph� h?p cho 1-2 ngu?i. L�ng n?i ch?ng d�nh c�n t?t, n?u com ch�n d?u.',
         150000, 'Used', 'Sell', NULL, N'KTX khu A �HQG TP.HCM', 'Active', 29, DATEADD(DAY, -5, @now), DATEADD(DAY, -5, @now)),
    (7,  3, 6, 2, N'M�y t�nh Casio FX-580VN X',
         N'M�y t�nh c?m tay Casio FX-580VN X, du?c ph�p mang v�o ph�ng thi. M�n h�nh r�, ph�m b?m nh?y, c�n n?p b?o v?.',
         350000, 'Good', 'Sell', NULL, N'C?ng tru?ng �H C�ng ngh?', 'Active', 64, DATEADD(DAY, -6, @now), DATEADD(DAY, -6, @now)),
    (8,  4, 6, 3, N'B? d?ng c? v? k? thu?t d?y d?',
         N'G?m thu?c ch? T, �ke, compa, b�t ch� kim 0.5 v� t�i d?ng. �� h?c xong m�n V? k? thu?t n�n t?ng l?i cho c�c b?n kh�a sau.',
         0, 'Used', 'Free', NULL, N'S?nh gi?ng du?ng A2 - NEU', 'Active', 22, DATEADD(DAY, -2, @now), DATEADD(DAY, -2, @now)),
    (9,  5, 7, 4, N'Balo laptop ch?ng s?c 15.6 inch',
         N'Balo m�u x�m, ngan laptop ch?ng s?c v?a m�y 15.6 inch, nhi?u ngan ph?, kh�a k�o ho?t d?ng t?t.',
         0, 'Good', 'Exchange', N'��n b�n h?c ho?c gi� s�ch mini', N'Cang tin PTIT', 'Active', 35, DATEADD(DAY, -3, @now), DATEADD(DAY, -3, @now)),
    (10, 6, 5, 5, N'Qu?t di?n d? b�n (c?n thay l?ng qu?t)',
         N'Qu?t d? b�n v?n ch?y t?t 3 t?c d?, l?ng qu?t b? n?t nh? c?n thay. Ai bi?t s?a th� nh?n v? d�ng r?t ?n.',
         0, 'NeedsRepair', 'Free', NULL, N'KTX khu A �HQG TP.HCM', 'Active', 18, DATEADD(DAY, -7, @now), DATEADD(DAY, -7, @now)),
    (11, 2, 5, 1, N'��n b�n LED ch?ng c?n g?p g?n',
         N'��n LED 3 ch? d? s�ng, ch?ng ch�i, g?p g?n. M?i mua 1 th�ng, c�n nguy�n h?p.',
         120000, 'New', 'Sell', NULL, N'Thu vi?n T? Quang B?u', 'Completed', 47, DATEADD(DAY, -10, @now), DATEADD(DAY, -8, @now)),
    (12, 3, 8, 2, N'Xe d?p mini Nh?t cu m�u xanh',
         N'Xe d?p mini Nh?t b�i, khung ch?c, c� gi? tru?c, phanh v� x�ch v?a b?o du?ng. Ph� h?p di l?i quanh k� t�c x�.',
         900000, 'Used', 'Sell', NULL, N'B�i xe KTX M? Tr�', 'Active', 89, DATEADD(DAY, -8, @now), DATEADD(DAY, -8, @now)),
    (13, 5, 3, 4, N'B�n ph�m co 68 ph�m switch Brown',
         N'B�n ph�m co layout 68 ph�m, switch Brown g� �m, keycap tr?ng - xanh mint, k?t n?i d�y Type-C.',
         600000, 'Good', 'Sell', NULL, N'Cang tin PTIT', 'Pending', 0, DATEADD(HOUR, -5, @now), DATEADD(HOUR, -5, @now));
    SET IDENTITY_INSERT dbo.Products OFF;

    -- ProductImages ----------------------------------------------------
    INSERT INTO dbo.ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder) VALUES
    (1,  N'/uploads/seed/p01.png', 1, 0),
    (2,  N'/uploads/seed/p02.png', 1, 0),
    (3,  N'/uploads/seed/p03.png', 1, 0),
    (3,  N'/uploads/seed/p13.png', 0, 1),
    (4,  N'/uploads/seed/p04.png', 1, 0),
    (5,  N'/uploads/seed/p05.png', 1, 0),
    (6,  N'/uploads/seed/p06.png', 1, 0),
    (7,  N'/uploads/seed/p07.png', 1, 0),
    (8,  N'/uploads/seed/p08.png', 1, 0),
    (9,  N'/uploads/seed/p09.png', 1, 0),
    (10, N'/uploads/seed/p10.png', 1, 0),
    (11, N'/uploads/seed/p11.png', 1, 0),
    (12, N'/uploads/seed/p12.png', 1, 0),
    (13, N'/uploads/seed/p13.png', 1, 0);

    -- Favorites --------------------------------------------------------
    INSERT INTO dbo.Favorites (UserId, ProductId) VALUES
    (2, 3), (2, 12), (2, 6), (3, 3), (3, 4), (4, 1), (4, 12), (5, 3), (5, 12), (6, 4);

    -- Transactions -----------------------------------------------------
    SET IDENTITY_INSERT dbo.Transactions ON;
    INSERT INTO dbo.Transactions (TransactionId, ProductId, SellerId, BuyerId, TransactionType, ProposedProductId, Message, MeetingPlace, MeetingTime, SellerNote, Status, CreatedAt, UpdatedAt, RespondedAt, CompletedAt) VALUES
    (1, 11, 2, 5, 'Sell',     NULL, N'M�nh mu?n mua d�n b�n, chi?u mai qua l?y du?c kh�ng b?n?', N'S?nh thu vi?n T? Quang B?u', DATEADD(DAY, -8, @now), N'H?n b?n 17h nh�', 'Completed', DATEADD(DAY, -9, @now), DATEADD(DAY, -8, @now), DATEADD(DAY, -9, @now), DATEADD(DAY, -8, @now)),
    (2, 3,  4, 2, 'Sell',     NULL, N'Laptop c�n b?o h�nh kh�ng b?n? M�nh mu?n mua d? h?c l?p tr�nh.', NULL, NULL, NULL, 'Pending', DATEADD(HOUR, -20, @now), DATEADD(HOUR, -20, @now), NULL, NULL),
    (3, 2,  3, 2, 'Exchange', NULL, N'M�nh c� s�ch Refactoring b?n ti?ng Anh, d?i v?i b?n nh�?', N'C?ng tru?ng �H C�ng ngh?', DATEADD(DAY, 2, @now), N'Ok b?n, th? 7 g?p nh�', 'Accepted', DATEADD(DAY, -1, @now), DATEADD(HOUR, -12, @now), DATEADD(HOUR, -12, @now), NULL),
    (4, 5,  2, 3, 'Free',     NULL, N'Cho m�nh xin �o nh�, m�nh cung h?c CNTT ?.', NULL, NULL, NULL, 'Pending', DATEADD(HOUR, -6, @now), DATEADD(HOUR, -6, @now), NULL, NULL),
    (5, 7,  3, 2, 'Sell',     NULL, N'B?t cho m�nh c�n 300k du?c kh�ng b?n?', NULL, NULL, N'M�nh d� c� ngu?i h?n mua tru?c r?i, xin l?i b?n nh�.', 'Rejected', DATEADD(DAY, -4, @now), DATEADD(DAY, -3, @now), DATEADD(DAY, -3, @now), NULL),
    (6, 4,  5, 3, 'Sell',     NULL, N'M�nh mu?n mua tai nghe.', NULL, NULL, NULL, 'Cancelled', DATEADD(DAY, -3, @now), DATEADD(DAY, -2, @now), NULL, NULL),
    (7, 9,  5, 2, 'Exchange', 1,    N'M�nh d?i gi�o tr�nh Gi?i t�ch 1 l?y balo du?c kh�ng b?n?', NULL, NULL, NULL, 'Pending', DATEADD(HOUR, -3, @now), DATEADD(HOUR, -3, @now), NULL, NULL);
    SET IDENTITY_INSERT dbo.Transactions OFF;

    -- Reviews (ch? cho giao d?ch d� ho�n th�nh #1) -----------------------
    INSERT INTO dbo.Reviews (TransactionId, ReviewerId, RevieweeId, Rating, Comment, CreatedAt) VALUES
    (1, 5, 2, 5, N'��n c�n m?i y nhu m� t?, b?n b�n r?t nhi?t t�nh!', DATEADD(DAY, -7, @now)),
    (1, 2, 5, 5, N'Giao d?ch nhanh g?n, d�ng h?n.',                   DATEADD(DAY, -7, @now));

    -- Conversations & Messages ------------------------------------------
    SET IDENTITY_INSERT dbo.Conversations ON;
    INSERT INTO dbo.Conversations (ConversationId, User1Id, User2Id, ProductId, CreatedAt, LastMessageAt) VALUES
    (1, 2, 5, 11, DATEADD(DAY, -9, @now),   DATEADD(DAY, -9, @now)),
    (2, 2, 3, 2,  DATEADD(DAY, -1, @now),   DATEADD(HOUR, -12, @now)),
    (3, 2, 4, 3,  DATEADD(HOUR, -20, @now), DATEADD(HOUR, -20, @now));
    SET IDENTITY_INSERT dbo.Conversations OFF;

    INSERT INTO dbo.Messages (ConversationId, SenderId, Content, SentAt, IsRead, ReadAt) VALUES
    (1, 5, N'Ch�o b?n, d�n b�n c�n kh�ng ??',                         DATEADD(MINUTE, -10, DATEADD(DAY, -9, @now)), 1, DATEADD(DAY, -9, @now)),
    (1, 2, N'C�n b?n nh�, m?i d�ng 1 th�ng th�i.',                    DATEADD(MINUTE, -8,  DATEADD(DAY, -9, @now)), 1, DATEADD(DAY, -9, @now)),
    (1, 5, N'Chi?u mai 5h m�nh qua thu vi?n l?y nh�.',                DATEADD(MINUTE, -5,  DATEADD(DAY, -9, @now)), 1, DATEADD(DAY, -9, @now)),
    (1, 2, N'Ok b?n, h?n g?p ? s?nh thu vi?n.',                       DATEADD(DAY, -9, @now),                       1, DATEADD(DAY, -9, @now)),
    (2, 2, N'M�nh v?a g?i d? ngh? d?i s�ch r?i nh� b?n.',             DATEADD(DAY, -1, @now),                       1, DATEADD(HOUR, -13, @now)),
    (2, 3, N'M�nh d� ch?p nh?n, th? 7 g?p ? c?ng tru?ng nha.',        DATEADD(HOUR, -12, @now),                     0, NULL),
    (3, 2, N'Laptop pin c�n d�ng du?c bao l�u v?y b?n?',              DATEADD(HOUR, -20, @now),                     0, NULL);

    -- Notifications ----------------------------------------------------
    INSERT INTO dbo.Notifications (UserId, Title, Content, Type, RelatedId, Link, IsRead, CreatedAt) VALUES
    (4, N'Y�u c?u mua m?i',                 N'Nguy?n Minh Anh mu?n mua "Laptop Dell Latitude 7490 i5/8GB/256GB".', 'Transaction', 2, N'/profile?tab=received', 0, DATEADD(HOUR, -20, @now)),
    (4, N'Tin nh?n m?i',                    N'Nguy?n Minh Anh d� g?i cho b?n m?t tin nh?n.',                        'Message',     3, N'/messages/3',           0, DATEADD(HOUR, -20, @now)),
    (2, N'�? ngh? trao d?i du?c ch?p nh?n', N'Tr?n Thu H� d� ch?p nh?n d? ngh? trao d?i "S�ch Clean Code (b?n ti?ng Vi?t)".', 'Transaction', 3, N'/profile?tab=sent', 0, DATEADD(HOUR, -12, @now)),
    (2, N'Tin nh?n m?i',                    N'Tr?n Thu H� d� g?i cho b?n m?t tin nh?n.',                            'Message',     2, N'/messages/2',           0, DATEADD(HOUR, -12, @now)),
    (2, N'Y�u c?u b? t? ch?i',              N'Y�u c?u mua "M�y t�nh Casio FX-580VN X" d� b? t? ch?i.',              'Transaction', 5, N'/profile?tab=sent',     1, DATEADD(DAY, -3, @now)),
    (2, N'�ang k� nh?n d? m?i',             N'Tr?n Thu H� mu?n nh?n "�o kho�c d?ng ph?c khoa CNTT size L".',        'Transaction', 4, N'/profile?tab=received', 0, DATEADD(HOUR, -6, @now)),
    (2, N'B?n nh?n du?c d�nh gi� m?i',      N'Ph?m Gia B?o d� d�nh gi� b?n 5 sao.',                                 'Review',      1, N'/profile?tab=reviews',  1, DATEADD(DAY, -7, @now)),
    (5, N'�? ngh? trao d?i m?i',            N'Nguy?n Minh Anh mu?n trao d?i "Balo laptop ch?ng s?c 15.6 inch".',    'Transaction', 7, N'/profile?tab=received', 0, DATEADD(HOUR, -3, @now)),
    (5, N'Tin dang dang ch? duy?t',         N'Tin "B�n ph�m co 68 ph�m switch Brown" dang ch? qu?n tr? vi�n duy?t.', 'Product',    13, N'/products/13',          0, DATEADD(HOUR, -5, @now));

    -- Reports ----------------------------------------------------------
    INSERT INTO dbo.Reports (ReporterId, ProductId, ReportedUserId, Reason, Description, Status, AdminNote, ResolvedBy, CreatedAt, ResolvedAt) VALUES
    (3, 12, NULL, N'Gi� kh�ng h?p l�',            N'Gi� cao hon nhi?u so v?i xe c�ng lo?i.',       'Pending',  NULL, NULL, DATEADD(HOUR, -30, @now), NULL),
    (4, NULL, 6,  N'Kh�ng ph?n h?i sau khi h?n',  N'�� h?n nhung b?n ?y kh�ng d?n v� kh�ng b�o.',  'Pending',  NULL, NULL, DATEADD(HOUR, -10, @now), NULL),
    (2, 6, NULL,  N'Th�ng tin sai s? th?t',       N'?nh c� v? kh�ng ph?i ?nh th?t.',               'Rejected', N'�� ki?m tra, ?nh l� ?nh th?t c?a ngu?i b�n.', 1, DATEADD(DAY, -4, @now), DATEADD(DAY, -3, @now));
END
ELSE
    PRINT N'>> �� c� d? li?u ngu?i d�ng � b? qua d? li?u demo';
GO

PRINT N'>> Ho�n t?t kh?i t?o UniShareDB';
GO
