import http from 'node:http';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';

import { config, assertConfig, ROOT_DIR } from './config/env.js';
import { db } from './config/db.js';
import { initSocket } from './utils/realtime.js';
import { authenticate, optionalAuth, requireRole } from './middlewares/auth.js';
import { notFoundHandler, errorHandler } from './middlewares/errorHandler.js';
import { uploadProductImages, uploadAvatar } from './middlewares/upload.js';
import { ok, created, paginated } from './utils/response.js';
import { parsePagination, toPositiveInt, toNonNegativeNumber, toList, toTrimmed } from './utils/query.js';
import { signToken, setAuthCookie, clearAuthCookie } from './utils/jwt.js';

import * as authService from './services/authService.js';
import * as catalogService from './services/catalogService.js';
import * as productService from './services/productService.js';
import * as favoriteService from './services/favoriteService.js';
import * as transactionService from './services/transactionService.js';
import * as messageService from './services/messageService.js';
import * as notificationService from './services/notificationService.js';
import * as reviewService from './services/reviewService.js';
import * as userService from './services/userService.js';
import * as adminService from './services/adminService.js';
import * as reportService from './services/reportService.js';
import * as contentService from './services/contentService.js';

// Kiểm tra biến môi trường
assertConfig();

const app = express();
const server = http.createServer(app);

// Khởi tạo Socket.IO
initSocket(server);

// Bảo mật & Tiện ích
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: (origin, callback) => {
      // Cho phép requests không có origin (mobile apps, Postman) hoặc nằm trong whitelist
      if (!origin || config.clientUrls.includes(origin) || origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(null, true); // Dev mode thân thiện
      }
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (config.env === 'development') {
  app.use(morgan('dev'));
}

// Phục vụ ảnh tĩnh (Uploads)
app.use('/uploads', express.static(path.join(ROOT_DIR, 'uploads')));

// Router chính
const api = express.Router();

// --- CATALOG ---
api.get('/catalog/universities', async (_req, res, next) => {
  try {
    const list = await catalogService.listUniversities();
    return ok(res, list);
  } catch (err) {
    next(err);
  }
});

api.get('/catalog/categories', async (req, res, next) => {
  try {
    const includeHidden = req.query.all === 'true' || req.query.all === '1';
    const list = await catalogService.listCategories({ includeHidden });
    return ok(res, list);
  } catch (err) {
    next(err);
  }
});

api.post('/catalog/categories', authenticate, requireRole('Admin'), async (req, res, next) => {
  try {
    const createdCat = await catalogService.createCategory(req.body);
    return created(res, createdCat, 'Tạo danh mục mới thành công');
  } catch (err) {
    next(err);
  }
});

api.put('/catalog/categories/:id', authenticate, requireRole('Admin'), async (req, res, next) => {
  try {
    const id = toPositiveInt(req.params.id);
    const updatedCat = await catalogService.updateCategory(id, req.body);
    return ok(res, updatedCat, 'Cập nhật danh mục thành công');
  } catch (err) {
    next(err);
  }
});

api.delete('/catalog/categories/:id', authenticate, requireRole('Admin'), async (req, res, next) => {
  try {
    const id = toPositiveInt(req.params.id);
    await catalogService.deleteCategory(id);
    return ok(res, null, 'Xóa danh mục thành công');
  } catch (err) {
    next(err);
  }
});

// --- AUTH ---
api.post('/auth/register', async (req, res, next) => {
  try {
    const user = await authService.register(req.body);
    const token = signToken(user);
    setAuthCookie(res, user);
    return created(res, { token, user: authService.toAccountDto(user) }, 'Đăng ký tài khoản thành công');
  } catch (err) {
    next(err);
  }
});

api.post('/auth/login', async (req, res, next) => {
  try {
    const user = await authService.login(req.body);
    const token = signToken(user);
    setAuthCookie(res, user);
    return ok(res, { token, user: authService.toAccountDto(user) }, 'Đăng nhập thành công');
  } catch (err) {
    next(err);
  }
});

api.post('/auth/logout', (_req, res) => {
  clearAuthCookie(res);
  return ok(res, null, 'Đăng xuất thành công');
});

api.get('/auth/me', authenticate, async (req, res, next) => {
  try {
    const user = await authService.getAccount(req.user.id);
    return ok(res, authService.toAccountDto(user));
  } catch (err) {
    next(err);
  }
});

api.put('/auth/change-password', authenticate, async (req, res, next) => {
  try {
    const user = await authService.changePassword(req.user.id, req.body);
    return ok(res, authService.toAccountDto(user), 'Đổi mật khẩu thành công');
  } catch (err) {
    next(err);
  }
});

api.post('/auth/forgot-password', async (req, res, next) => {
  try {
    const result = await authService.forgotPassword(req.body.email);
    return ok(res, result, 'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được tạo');
  } catch (err) {
    next(err);
  }
});

api.post('/auth/reset-password', async (req, res, next) => {
  try {
    await authService.resetPassword(req.body);
    return ok(res, null, 'Đặt lại mật khẩu thành công');
  } catch (err) {
    next(err);
  }
});

// --- PRODUCTS ---
api.get('/products', optionalAuth, async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query, { defaultLimit: 12 });
    const filters = {
      q: toTrimmed(req.query.q),
      categoryId: toPositiveInt(req.query.categoryId),
      universityId: toPositiveInt(req.query.universityId),
      minPrice: toNonNegativeNumber(req.query.minPrice),
      maxPrice: toNonNegativeNumber(req.query.maxPrice),
      conditions: toList(req.query.condition || req.query.conditions, ['New', 'Good', 'Used', 'NeedsRepair']),
      transactionTypes: toList(req.query.transactionType || req.query.transactionTypes, ['Sell', 'Exchange', 'Free']),
      sort: req.query.sort,
    };
    const result = await productService.listProducts(filters, pagination);
    return ok(res, result.items, 'Thành công', result.meta);
  } catch (err) {
    next(err);
  }
});

api.get('/products/mine', authenticate, async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query);
    const result = await productService.listMine(req.user.id, req.query, pagination);
    return ok(res, result.items, 'Thành công', result.meta);
  } catch (err) {
    next(err);
  }
});

api.get('/products/:id', optionalAuth, async (req, res, next) => {
  try {
    const id = toPositiveInt(req.params.id);
    const detail = await productService.getProductDetail(id, req.user);
    return ok(res, detail);
  } catch (err) {
    next(err);
  }
});

api.get('/products/:id/similar', async (req, res, next) => {
  try {
    const id = toPositiveInt(req.params.id);
    const list = await productService.listSimilar(id);
    return ok(res, list);
  } catch (err) {
    next(err);
  }
});

api.post('/products', authenticate, ...uploadProductImages, async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.user, req.body, req.files);
    return created(res, product, 'Tạo tin đăng thành công');
  } catch (err) {
    next(err);
  }
});

api.put('/products/:id', authenticate, async (req, res, next) => {
  try {
    const id = toPositiveInt(req.params.id);
    const updated = await productService.updateProduct(id, req.user, req.body);
    return ok(res, updated, 'Cập nhật tin đăng thành công');
  } catch (err) {
    next(err);
  }
});

api.delete('/products/:id', authenticate, async (req, res, next) => {
  try {
    const id = toPositiveInt(req.params.id);
    await productService.deleteProduct(id, req.user);
    return ok(res, null, 'Xóa tin đăng thành công');
  } catch (err) {
    next(err);
  }
});

api.patch('/products/:id/status', authenticate, async (req, res, next) => {
  try {
    const id = toPositiveInt(req.params.id);
    const updated = await productService.changeOwnStatus(id, req.user, req.body.status);
    return ok(res, updated, 'Cập nhật trạng thái thành công');
  } catch (err) {
    next(err);
  }
});

// --- FAVORITES ---
api.get('/favorites', authenticate, async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query);
    const result = await favoriteService.listFavorites(req.user.id, pagination);
    return ok(res, result.items, 'Thành công', result.meta);
  } catch (err) {
    next(err);
  }
});

api.get('/favorites/ids', authenticate, async (req, res, next) => {
  try {
    const ids = await favoriteService.listFavoriteIds(req.user.id);
    return ok(res, ids);
  } catch (err) {
    next(err);
  }
});

api.post('/favorites/:productId', authenticate, async (req, res, next) => {
  try {
    const id = toPositiveInt(req.params.productId);
    await favoriteService.addFavorite(req.user.id, id);
    return ok(res, { isFavorited: true }, 'Đã thêm vào mục yêu thích');
  } catch (err) {
    next(err);
  }
});

api.delete('/favorites/:productId', authenticate, async (req, res, next) => {
  try {
    const id = toPositiveInt(req.params.productId);
    await favoriteService.removeFavorite(req.user.id, id);
    return ok(res, { isFavorited: false }, 'Đã xóa khỏi mục yêu thích');
  } catch (err) {
    next(err);
  }
});

// --- TRANSACTIONS / REQUESTS ---
api.post('/transactions', authenticate, async (req, res, next) => {
  try {
    const tx = await transactionService.createRequest(req.user, req.body);
    return created(res, tx, 'Gửi yêu cầu giao dịch thành công');
  } catch (err) {
    next(err);
  }
});

api.get('/transactions', authenticate, async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query);
    const result = await transactionService.listTransactions(req.user.id, req.query, pagination);
    return ok(res, result.items, 'Thành công', result.meta);
  } catch (err) {
    next(err);
  }
});

api.get('/transactions/:id', authenticate, async (req, res, next) => {
  try {
    const id = toPositiveInt(req.params.id);
    const tx = await transactionService.getTransaction(id, req.user.id);
    return ok(res, tx);
  } catch (err) {
    next(err);
  }
});

api.put('/transactions/:id/accept', authenticate, async (req, res, next) => {
  try {
    const id = toPositiveInt(req.params.id);
    const tx = await transactionService.acceptRequest(id, req.user);
    return ok(res, tx, 'Đã chấp nhận yêu cầu giao dịch');
  } catch (err) {
    next(err);
  }
});

api.put('/transactions/:id/reject', authenticate, async (req, res, next) => {
  try {
    const id = toPositiveInt(req.params.id);
    const tx = await transactionService.rejectRequest(id, req.user, req.body.note);
    return ok(res, tx, 'Đã từ chối yêu cầu giao dịch');
  } catch (err) {
    next(err);
  }
});

api.put('/transactions/:id/cancel', authenticate, async (req, res, next) => {
  try {
    const id = toPositiveInt(req.params.id);
    const tx = await transactionService.cancelRequest(id, req.user);
    return ok(res, tx, 'Đã hủy yêu cầu giao dịch');
  } catch (err) {
    next(err);
  }
});

api.put('/transactions/:id/meeting', authenticate, async (req, res, next) => {
  try {
    const id = toPositiveInt(req.params.id);
    const tx = await transactionService.updateMeeting(id, req.user, req.body);
    return ok(res, tx, 'Cập nhật địa điểm hẹn thành công');
  } catch (err) {
    next(err);
  }
});

api.put('/transactions/:id/complete', authenticate, async (req, res, next) => {
  try {
    const id = toPositiveInt(req.params.id);
    const tx = await transactionService.completeRequest(id, req.user);
    return ok(res, tx, 'Đã xác nhận hoàn thành giao dịch');
  } catch (err) {
    next(err);
  }
});

// --- MESSAGES / CONVERSATIONS ---
api.get('/messages/conversations', authenticate, async (req, res, next) => {
  try {
    const list = await messageService.listConversations(req.user.id);
    return ok(res, list);
  } catch (err) {
    next(err);
  }
});

api.post('/messages/start', authenticate, async (req, res, next) => {
  try {
    const { targetUserId, recipientId, productId, message } = req.body;
    const conv = await messageService.startConversation(req.user, {
      recipientId: toPositiveInt(targetUserId || recipientId),
      productId: toPositiveInt(productId),
      message,
    });
    return created(res, conv);
  } catch (err) {
    next(err);
  }
});

api.get('/messages/conversations/:id', authenticate, async (req, res, next) => {
  try {
    const conv = await messageService.getConversation(toPositiveInt(req.params.id), req.user.id);
    return ok(res, conv);
  } catch (err) {
    next(err);
  }
});

api.get('/messages/conversations/:id/messages', authenticate, async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query, { defaultLimit: 30 });
    const result = await messageService.listMessages(toPositiveInt(req.params.id), req.user.id, pagination);
    return ok(res, result.items, 'Thành công', result.meta);
  } catch (err) {
    next(err);
  }
});

api.post('/messages/conversations/:id/messages', authenticate, async (req, res, next) => {
  try {
    const msg = await messageService.sendMessage(req.user, {
      conversationId: toPositiveInt(req.params.id),
      content: req.body.content,
    });
    return created(res, msg);
  } catch (err) {
    next(err);
  }
});

api.put('/messages/conversations/:id/read', authenticate, async (req, res, next) => {
  try {
    await messageService.markConversationRead(toPositiveInt(req.params.id), req.user.id);
    return ok(res, null, 'Đã đánh dấu đã đọc');
  } catch (err) {
    next(err);
  }
});

api.get('/messages/unread-count', authenticate, async (req, res, next) => {
  try {
    const count = await messageService.unreadMessageCount(req.user.id);
    return ok(res, { unreadCount: count });
  } catch (err) {
    next(err);
  }
});

// --- NOTIFICATIONS ---
api.get('/notifications', authenticate, async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query);
    const result = await notificationService.list(req.user.id, pagination);
    return ok(res, result.items, 'Thành công', result.meta);
  } catch (err) {
    next(err);
  }
});

api.get('/notifications/unread-count', authenticate, async (req, res, next) => {
  try {
    const count = await notificationService.unreadCount(req.user.id);
    return ok(res, { unreadCount: count });
  } catch (err) {
    next(err);
  }
});

api.put('/notifications/:id/read', authenticate, async (req, res, next) => {
  try {
    await notificationService.markRead(toPositiveInt(req.params.id), req.user.id);
    return ok(res, null, 'Đã đánh dấu đã đọc');
  } catch (err) {
    next(err);
  }
});

api.put('/notifications/read-all', authenticate, async (req, res, next) => {
  try {
    await notificationService.markAllRead(req.user.id);
    return ok(res, null, 'Đã đánh dấu tất cả đã đọc');
  } catch (err) {
    next(err);
  }
});

// --- REVIEWS ---
api.post('/reviews', authenticate, async (req, res, next) => {
  try {
    const review = await reviewService.createReview(req.user, req.body);
    return created(res, review, 'Gửi đánh giá thành công');
  } catch (err) {
    next(err);
  }
});

api.get('/reviews/user/:userId', async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query);
    const result = await reviewService.listUserReviews(toPositiveInt(req.params.userId), pagination);
    return ok(res, result.items, 'Thành công', result.meta);
  } catch (err) {
    next(err);
  }
});

// --- USER PROFILE ---
api.get('/users/summary', authenticate, async (req, res, next) => {
  try {
    const summary = await userService.getMySummary(req.user.id);
    return ok(res, summary);
  } catch (err) {
    next(err);
  }
});

api.get('/users/:id', async (req, res, next) => {
  try {
    const profile = await userService.getPublicProfile(toPositiveInt(req.params.id));
    return ok(res, profile);
  } catch (err) {
    next(err);
  }
});

api.put('/users/profile', authenticate, async (req, res, next) => {
  try {
    const updated = await userService.updateProfile(req.user.id, req.body);
    return ok(res, updated, 'Cập nhật hồ sơ thành công');
  } catch (err) {
    next(err);
  }
});

api.post('/users/avatar', authenticate, ...uploadAvatar, async (req, res, next) => {
  try {
    const result = await userService.updateAvatar(req.user.id, req.file);
    return ok(res, result, 'Cập nhật ảnh đại diện thành công');
  } catch (err) {
    next(err);
  }
});

// --- SITE CONTENTS ---
api.get('/content/stats', async (_req, res, next) => {
  try {
    const stats = await contentService.getPublicStats();
    return ok(res, stats);
  } catch (err) {
    next(err);
  }
});

api.get('/content/:slug', async (req, res, next) => {
  try {
    const content = await contentService.getContent(req.params.slug);
    return ok(res, content);
  } catch (err) {
    next(err);
  }
});

// --- ADMIN ---
api.get('/admin/stats', authenticate, requireRole('Admin'), async (_req, res, next) => {
  try {
    const stats = await adminService.getDashboardStats();
    return ok(res, stats);
  } catch (err) {
    next(err);
  }
});

api.get('/admin/users', authenticate, requireRole('Admin'), async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query);
    const result = await adminService.listUsers(req.query, pagination);
    return ok(res, result.items, 'Thành công', result.meta);
  } catch (err) {
    next(err);
  }
});

api.patch('/admin/users/:id/status', authenticate, requireRole('Admin'), async (req, res, next) => {
  try {
    const updated = await adminService.setUserStatus(toPositiveInt(req.params.id), req.body.status, req.user);
    return ok(res, updated, 'Cập nhật trạng thái thành viên thành công');
  } catch (err) {
    next(err);
  }
});

api.get('/admin/products', authenticate, requireRole('Admin'), async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query);
    const result = await adminService.listAllProducts(req.query, pagination);
    return ok(res, result.items, 'Thành công', result.meta);
  } catch (err) {
    next(err);
  }
});

api.patch('/admin/products/:id/moderate', authenticate, requireRole('Admin'), async (req, res, next) => {
  try {
    const updated = await adminService.moderateProduct(toPositiveInt(req.params.id), req.body, req.user);
    return ok(res, updated, 'Kiểm duyệt tin đăng thành công');
  } catch (err) {
    next(err);
  }
});

api.get('/admin/reports', authenticate, requireRole('Admin'), async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query);
    const result = await reportService.listReports(req.query, pagination);
    return ok(res, result.items, 'Thành công', result.meta);
  } catch (err) {
    next(err);
  }
});

api.patch('/admin/reports/:id/resolve', authenticate, requireRole('Admin'), async (req, res, next) => {
  try {
    const updated = await reportService.resolveReport(toPositiveInt(req.params.id), req.body, req.user);
    return ok(res, updated, 'Xử lý báo cáo thành công');
  } catch (err) {
    next(err);
  }
});

// Gắn prefix /api
app.use('/api', api);

// Bắt 404 & Lỗi tập trung
app.use(notFoundHandler);
app.use(errorHandler);

// Lắng nghe cổng
server.listen(config.port, () => {
  console.log(`[UniShare API] Server running on http://localhost:${config.port} (${config.env})`);
});

