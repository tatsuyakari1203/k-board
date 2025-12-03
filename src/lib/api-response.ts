import { NextResponse } from "next/server";
import { ApiResponse } from "@/types/api";

export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status }
  );
}

export function errorResponse(
  error: string,
  status: number = 400,
  message?: string
): NextResponse<ApiResponse<never>> {
  return NextResponse.json(
    {
      success: false,
      error,
      message,
    },
    { status }
  );
}

export function paginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  message?: string
): NextResponse<ApiResponse<T[]>> {
  const totalPages = Math.ceil(total / limit);
  return NextResponse.json({
    success: true,
    data,
    message,
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
  });
}
