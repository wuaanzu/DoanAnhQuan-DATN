/** Lỗi nghiệp vụ có HTTP status code – được errorHandler chuyển thành JSON chuẩn. */
export class ApiError extends Error {
  constructor(statusCode, message, errors = undefined) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
  }

  static badRequest(message = 'Yêu cầu không hợp lệ', errors) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'Vui lòng đăng nhập để tiếp tục') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Bạn không có quyền thực hiện thao tác này') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Không tìm thấy dữ liệu') {
    return new ApiError(404, message);
  }

  static conflict(message = 'Dữ liệu bị trùng lặp', errors) {
    return new ApiError(409, message, errors);
  }

  static validation(errors, message = 'Dữ liệu không hợp lệ') {
    return new ApiError(422, message, errors);
  }
}
