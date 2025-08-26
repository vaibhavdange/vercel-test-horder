import { NextRequest, NextResponse } from "next/server";

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore: RateLimitStore = {};

export function createRateLimiter(config: RateLimitConfig) {
  return (request: NextRequest): NextResponse | null => {
    const clientId = getClientId(request);
    const now = Date.now();
    
    if (!rateLimitStore[clientId]) {
      rateLimitStore[clientId] = {
        count: 0,
        resetTime: now + config.windowMs
      };
    }
    
    const client = rateLimitStore[clientId];
    
    // Reset counter if window has passed
    if (now > client.resetTime) {
      client.count = 0;
      client.resetTime = now + config.windowMs;
    }
    
    // Check if limit exceeded
    if (client.count >= config.maxRequests) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((client.resetTime - now) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((client.resetTime - now) / 1000).toString()
          }
        }
      );
    }
    
    // Increment counter
    client.count++;
    
    return null; // Continue to next middleware
  };
}

function getClientId(request: NextRequest): string {
  // Use IP address as client identifier
  // In production, consider using more sophisticated methods
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded || realIp || 'unknown';
  
  return ip.toString();
}

// Default rate limit: 100 requests per minute
export const defaultRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100
});

// Strict rate limit: 10 requests per minute
export const strictRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10
});
