// ============================================
// APPLICATION CONSTANTS
// ============================================

export const APP_NAME = "K-Board";
export const APP_DESCRIPTION = "Hệ thống quản lý doanh nghiệp";

// ============================================
// PAGINATION
// ============================================

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// ============================================
// FILE UPLOAD
// ============================================

export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_SIZE_LABEL: "5MB",
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  ALLOWED_DOCUMENT_TYPES: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  ALLOWED_ALL_TYPES: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
} as const;

// ============================================
// DATES
// ============================================

export const DATE_FORMATS = {
  DISPLAY: "dd/MM/yyyy",
  DISPLAY_WITH_TIME: "dd/MM/yyyy HH:mm",
  API: "yyyy-MM-dd",
  API_WITH_TIME: "yyyy-MM-dd'T'HH:mm:ss",
  RELATIVE_THRESHOLD_DAYS: 7, // Show relative date within 7 days
} as const;

// ============================================
// DEBOUNCE & THROTTLE
// ============================================

export const TIMING = {
  DEBOUNCE_SEARCH: 300,
  DEBOUNCE_SAVE: 500,
  THROTTLE_SCROLL: 100,
  AUTO_SAVE_INTERVAL: 30000, // 30 seconds
  SESSION_REFRESH_INTERVAL: 300000, // 5 minutes
} as const;

// ============================================
// UI
// ============================================

export const UI = {
  SIDEBAR_WIDTH: 256,
  HEADER_HEIGHT: 64,
  TOAST_DURATION: 3000,
  MODAL_Z_INDEX: 50,
  DROPDOWN_Z_INDEX: 40,
  TABLE_MIN_COLUMN_WIDTH: 100,
  TABLE_DEFAULT_COLUMN_WIDTH: 150,
  KANBAN_COLUMN_WIDTH: 280,
} as const;

// ============================================
// COLORS
// ============================================

export const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  active: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  inactive: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
} as const;

export const PROPERTY_COLORS = [
  {
    id: "gray",
    bg: "bg-gray-100",
    text: "text-gray-800",
    dark: "dark:bg-gray-800 dark:text-gray-200",
  },
  {
    id: "red",
    bg: "bg-red-100",
    text: "text-red-800",
    dark: "dark:bg-red-900/40 dark:text-red-300",
  },
  {
    id: "orange",
    bg: "bg-orange-100",
    text: "text-orange-800",
    dark: "dark:bg-orange-900/40 dark:text-orange-300",
  },
  {
    id: "yellow",
    bg: "bg-yellow-100",
    text: "text-yellow-800",
    dark: "dark:bg-yellow-900/40 dark:text-yellow-300",
  },
  {
    id: "green",
    bg: "bg-green-100",
    text: "text-green-800",
    dark: "dark:bg-green-900/40 dark:text-green-300",
  },
  {
    id: "blue",
    bg: "bg-blue-100",
    text: "text-blue-800",
    dark: "dark:bg-blue-900/40 dark:text-blue-300",
  },
  {
    id: "purple",
    bg: "bg-purple-100",
    text: "text-purple-800",
    dark: "dark:bg-purple-900/40 dark:text-purple-300",
  },
  {
    id: "pink",
    bg: "bg-pink-100",
    text: "text-pink-800",
    dark: "dark:bg-pink-900/40 dark:text-pink-300",
  },
] as const;

// ============================================
// KEYBOARD SHORTCUTS
// ============================================

export const SHORTCUTS = {
  // Global
  SEARCH: { key: "k", meta: true, label: "Tìm kiếm" },
  NEW_TASK: { key: "n", meta: true, label: "Tạo công việc mới" },
  SAVE: { key: "s", meta: true, label: "Lưu" },

  // Navigation
  GO_TO_DASHBOARD: { key: "1", meta: true, label: "Tổng quan" },
  GO_TO_BOARDS: { key: "2", meta: true, label: "Quản lý công việc" },
  GO_TO_TODO: { key: "3", meta: true, label: "Việc của tôi" },

  // Table/Kanban
  DELETE_SELECTED: { key: "Backspace", label: "Xóa mục đã chọn" },
  SELECT_ALL: { key: "a", meta: true, label: "Chọn tất cả" },
  ESCAPE: { key: "Escape", label: "Hủy/Đóng" },
} as const;

// ============================================
// API ENDPOINTS
// ============================================

export const API_ENDPOINTS = {
  // Auth
  LOGIN: "/api/auth/signin",
  LOGOUT: "/api/auth/signout",
  REGISTER: "/api/auth/register",

  // Users
  USERS: "/api/users",
  ADMIN_USERS: "/api/admin/users",

  // Boards
  BOARDS: "/api/boards",

  // Settings
  SETTINGS: "/api/admin/settings",
} as const;

// ============================================
// REGEX PATTERNS
// ============================================

export const PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_VN: /^(0|\+84)[3|5|7|8|9][0-9]{8}$/,
  PASSWORD_STRONG: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  URL: /^https?:\/\/.+/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
} as const;

// ============================================
// VALIDATION MESSAGES
// ============================================

export const VALIDATION_MESSAGES = {
  REQUIRED: "Trường này là bắt buộc",
  EMAIL_INVALID: "Email không hợp lệ",
  PASSWORD_MIN: "Mật khẩu phải có ít nhất 6 ký tự",
  PASSWORD_STRONG:
    "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt",
  PHONE_INVALID: "Số điện thoại không hợp lệ",
  URL_INVALID: "URL không hợp lệ",
  FILE_TOO_LARGE: `File không được vượt quá ${FILE_UPLOAD.MAX_SIZE_LABEL}`,
  FILE_TYPE_INVALID: "Loại file không được hỗ trợ",
} as const;
