/**
 * Database Error Messages Utility
 * Pure function, không phụ thuộc vào Prisma hoặc Node.js modules
 * Có thể dùng trong client-side code
 */

/**
 * Get user-friendly error message từ error code
 */
export function getDatabaseErrorMessage(errorCode?: string, errorMessage?: string): string {
  if (!errorCode && !errorMessage) {
    return 'Lỗi kết nối database. Vui lòng liên hệ quản trị viên để kiểm tra cấu hình server.';
  }

  // Prisma error codes
  switch (errorCode) {
    case 'P1001':
      return 'Không thể kết nối đến database server. Vui lòng kiểm tra kết nối mạng hoặc liên hệ quản trị viên.';
    
    case 'P1002':
      return 'Database server không phản hồi. Vui lòng thử lại sau hoặc liên hệ quản trị viên.';
    
    case 'P1003':
      return 'Database không tồn tại. Vui lòng liên hệ quản trị viên để kiểm tra cấu hình.';
    
    case 'P1017':
      return 'Kết nối database bị đóng. Vui lòng thử lại sau.';
    
    case 'P1012':
      return 'Schema database không khớp. Vui lòng liên hệ quản trị viên.';
    
    case 'DATABASE_URL_MISSING':
      return 'Cấu hình database chưa được thiết lập. Vui lòng liên hệ quản trị viên.';
    
    case 'DATABASE_FILE_NOT_FOUND':
      return 'File database không tồn tại. Vui lòng liên hệ quản trị viên.';
  }

  // Network errors
  if (errorMessage?.includes('ECONNREFUSED')) {
    return 'Database server từ chối kết nối. Vui lòng liên hệ quản trị viên.';
  }

  if (errorMessage?.includes('ENOTFOUND')) {
    return 'Không tìm thấy database server. Vui lòng kiểm tra kết nối mạng hoặc liên hệ quản trị viên.';
  }

  if (errorMessage?.includes('timeout')) {
    return 'Kết nối database quá thời gian chờ. Vui lòng thử lại sau.';
  }

  // Default message
  return 'Lỗi kết nối database. Vui lòng liên hệ quản trị viên để kiểm tra cấu hình server.';
}
