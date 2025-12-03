export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type ApiErrorResponse = ApiResponse<never> & {
  success: false;
  error: string;
};

export type ApiSuccessResponse<T> = ApiResponse<T> & {
  success: true;
  data: T;
};
