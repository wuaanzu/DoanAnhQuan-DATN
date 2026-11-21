/** Hằng số nghiệp vụ dùng chung – khớp với CHECK constraint trong UniShareDB.sql */
export const ROLES = Object.freeze({ STUDENT: 'Student', ADMIN: 'Admin' });
export const USER_STATUS = Object.freeze({ ACTIVE: 'Active', LOCKED: 'Locked' });

export const PRODUCT_CONDITIONS = ['New', 'Good', 'Used', 'NeedsRepair'];
export const TRANSACTION_TYPES = ['Sell', 'Exchange', 'Free'];
export const PRODUCT_STATUS = Object.freeze({
  PENDING: 'Pending',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
  HIDDEN: 'Hidden',
});
export const PRODUCT_STATUSES = Object.values(PRODUCT_STATUS);

export const TX_STATUS = Object.freeze({
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed',
});
export const TX_STATUSES = Object.values(TX_STATUS);

export const REPORT_STATUSES = ['Pending', 'Resolved', 'Rejected'];
export const CATEGORY_STATUSES = ['Active', 'Hidden'];

export const PRODUCT_SORTS = ['newest', 'price_asc', 'price_desc', 'popular'];

export const TYPE_LABELS = { Sell: 'mua', Exchange: 'trao đổi', Free: 'nhận miễn phí' };
