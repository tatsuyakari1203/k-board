import { toast } from "sonner";

// ============================================
// TOAST UTILITIES
// ============================================

export const showToast = {
  success: (message: string, description?: string) => {
    toast.success(message, {
      description,
      duration: 3000,
    });
  },

  error: (message: string, description?: string) => {
    toast.error(message, {
      description,
      duration: 5000,
    });
  },

  info: (message: string, description?: string) => {
    toast.info(message, {
      description,
      duration: 3000,
    });
  },

  warning: (message: string, description?: string) => {
    toast.warning(message, {
      description,
      duration: 4000,
    });
  },

  loading: (message: string) => {
    return toast.loading(message);
  },

  dismiss: (toastId?: string | number) => {
    toast.dismiss(toastId);
  },

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    }
  ) => {
    return toast.promise(promise, messages);
  },
};

// ============================================
// ERROR HANDLING
// ============================================

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, unknown>;
}

export class AppError extends Error {
  code: string;
  status: number;
  details?: Record<string, unknown>;

  constructor(message: string, code = "UNKNOWN_ERROR", status = 500, details?: Record<string, unknown>) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

// Parse error from various sources
export function parseError(error: unknown): ApiError {
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
      status: error.status,
      details: error.details,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      code: "ERROR",
    };
  }

  if (typeof error === "string") {
    return {
      message: error,
      code: "ERROR",
    };
  }

  if (typeof error === "object" && error !== null) {
    const err = error as Record<string, unknown>;
    return {
      message: (err.message as string) || (err.error as string) || "Đã xảy ra lỗi",
      code: err.code as string,
      status: err.status as number,
      details: err.details as Record<string, unknown>,
    };
  }

  return {
    message: "Đã xảy ra lỗi không xác định",
    code: "UNKNOWN_ERROR",
  };
}

// Handle API errors with toast
export function handleApiError(error: unknown, fallbackMessage = "Đã xảy ra lỗi") {
  const parsed = parseError(error);
  showToast.error(parsed.message || fallbackMessage);
  console.error("API Error:", parsed);
  return parsed;
}

// ============================================
// API RESPONSE HELPERS
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export function createSuccessResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
  };
}

export function createErrorResponse(error: string, message?: string): ApiResponse {
  return {
    success: false,
    error,
    message,
  };
}

// ============================================
// FETCH WRAPPER WITH ERROR HANDLING
// ============================================

interface FetchOptions extends RequestInit {
  showErrorToast?: boolean;
}

export async function fetchApi<T>(
  url: string,
  options: FetchOptions = {}
): Promise<{ data: T | null; error: ApiError | null }> {
  const { showErrorToast = true, ...fetchOptions } = options;

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        "Content-Type": "application/json",
        ...fetchOptions.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      const error: ApiError = {
        message: data.error || data.message || `HTTP ${response.status}`,
        status: response.status,
        code: data.code,
        details: data.details,
      };

      if (showErrorToast) {
        showToast.error(error.message);
      }

      return { data: null, error };
    }

    return { data: data as T, error: null };
  } catch (err) {
    const error = parseError(err);

    if (showErrorToast) {
      showToast.error(error.message);
    }

    return { data: null, error };
  }
}

// ============================================
// COMMON ERROR MESSAGES
// ============================================

export const ERROR_MESSAGES = {
  UNAUTHORIZED: "Bạn không có quyền thực hiện thao tác này",
  NOT_FOUND: "Không tìm thấy dữ liệu",
  VALIDATION_FAILED: "Dữ liệu không hợp lệ",
  NETWORK_ERROR: "Lỗi kết nối. Vui lòng thử lại",
  SERVER_ERROR: "Lỗi hệ thống. Vui lòng thử lại sau",
  SESSION_EXPIRED: "Phiên đăng nhập đã hết hạn",
  PERMISSION_DENIED: "Bạn không có quyền truy cập",
} as const;

// ============================================
// SUCCESS MESSAGES
// ============================================

export const SUCCESS_MESSAGES = {
  CREATED: "Tạo thành công",
  UPDATED: "Cập nhật thành công",
  DELETED: "Xóa thành công",
  SAVED: "Đã lưu",
  COPIED: "Đã sao chép",
} as const;
