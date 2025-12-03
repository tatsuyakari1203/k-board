import { NextRequest, NextResponse } from "next/server";

// ============================================
// IN-MEMORY RATE LIMITER
// ============================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Simple in-memory store (for development/single instance)
// For production, use Redis or similar
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean every minute

// ============================================
// RATE LIMIT OPTIONS
// ============================================

export interface RateLimitOptions {
  // Max requests per window
  limit: number;
  // Window size in seconds
  windowSizeInSeconds: number;
  // Identifier function (default: IP address)
  identifier?: (req: NextRequest) => string;
  // Custom error response
  onRateLimited?: (req: NextRequest) => NextResponse;
}

// ============================================
// DEFAULT OPTIONS
// ============================================

const DEFAULT_OPTIONS: RateLimitOptions = {
  limit: 100,
  windowSizeInSeconds: 60,
};

// Presets for common use cases
export const RATE_LIMIT_PRESETS = {
  // General API endpoints
  API: { limit: 100, windowSizeInSeconds: 60 },
  // Auth endpoints (login, register)
  AUTH: { limit: 10, windowSizeInSeconds: 60 },
  // Sensitive operations (password reset, etc.)
  SENSITIVE: { limit: 5, windowSizeInSeconds: 300 },
  // File uploads
  UPLOAD: { limit: 20, windowSizeInSeconds: 60 },
  // Search/query endpoints
  SEARCH: { limit: 30, windowSizeInSeconds: 60 },
} as const;

// ============================================
// GET IDENTIFIER
// ============================================

function getIdentifier(req: NextRequest): string {
  // Try to get real IP from various headers
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback to a hash of user-agent if no IP
  const userAgent = req.headers.get("user-agent") || "unknown";
  return `ua-${hashCode(userAgent)}`;
}

function hashCode(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// ============================================
// RATE LIMITER
// ============================================

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export function rateLimit(
  req: NextRequest,
  endpoint: string,
  options: Partial<RateLimitOptions> = {}
): RateLimitResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const identifier = opts.identifier?.(req) || getIdentifier(req);
  const key = `${endpoint}:${identifier}`;
  const now = Date.now();
  const windowMs = opts.windowSizeInSeconds * 1000;

  let entry = rateLimitStore.get(key);

  // Create new entry if doesn't exist or expired
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + windowMs,
    };
  }

  entry.count++;
  rateLimitStore.set(key, entry);

  const remaining = Math.max(0, opts.limit - entry.count);
  const success = entry.count <= opts.limit;

  return {
    success,
    limit: opts.limit,
    remaining,
    reset: Math.ceil((entry.resetTime - now) / 1000),
  };
}

// ============================================
// RATE LIMIT RESPONSE
// ============================================

export function createRateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      error: "Quá nhiều yêu cầu. Vui lòng thử lại sau.",
      retryAfter: result.reset,
    },
    {
      status: 429,
      headers: {
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": result.reset.toString(),
        "Retry-After": result.reset.toString(),
      },
    }
  );
}

// ============================================
// MIDDLEWARE HELPER
// ============================================

export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse,
  options: Partial<RateLimitOptions> = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const endpoint = new URL(req.url).pathname;
    const result = rateLimit(req, endpoint, options);

    if (!result.success) {
      return createRateLimitResponse(result);
    }

    const response = await handler(req);

    // Add rate limit headers to successful responses
    response.headers.set("X-RateLimit-Limit", result.limit.toString());
    response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
    response.headers.set("X-RateLimit-Reset", result.reset.toString());

    return response;
  };
}

// ============================================
// CHECK RATE LIMIT (for use in API routes)
// ============================================

export function checkRateLimit(
  req: NextRequest,
  preset: keyof typeof RATE_LIMIT_PRESETS = "API"
): { allowed: boolean; response?: NextResponse } {
  const endpoint = new URL(req.url).pathname;
  const options = RATE_LIMIT_PRESETS[preset];
  const result = rateLimit(req, endpoint, options);

  if (!result.success) {
    return {
      allowed: false,
      response: createRateLimitResponse(result),
    };
  }

  return { allowed: true };
}
