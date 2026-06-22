import { Injectable, NestMiddleware } from '@nestjs/common';

type RequestLike = {
  method: string;
  path: string;
  ip?: string;
  socket: { remoteAddress?: string };
  headers: Record<string, string | string[] | undefined>;
};

type ResponseLike = {
  setHeader(name: string, value: string): void;
  status(code: number): { json(payload: unknown): void };
};

type NextFunction = () => void;

type RateBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateBucket>();

const defaultWindowMs = 60 * 1000;
const defaultLimit = 180;
const strictLimit = 12;
const uploadLimit = 20;

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  use(request: RequestLike, response: ResponseLike, next: NextFunction) {
    applySecurityHeaders(request, response);
    if (!enforceRateLimit(request, response)) return;
    next();
  }
}

function applySecurityHeaders(request: RequestLike, response: ResponseLike) {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.setHeader('Cross-Origin-Resource-Policy', isPublicProjectAssetPath(request.path) ? 'cross-origin' : 'same-site');
  response.setHeader('X-DNS-Prefetch-Control', 'off');
  response.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
}

function isPublicProjectAssetPath(path: string) {
  return /^\/api\/explorer\/projects\/[^/]+\/assets\/[^/]+\/public$/.test(path);
}

function enforceRateLimit(request: RequestLike, response: ResponseLike): boolean {
  const limit = limitFor(request);
  const key = `${clientIp(request)}:${request.method}:${normalizedPath(request.path)}`;
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + defaultWindowMs });
    cleanupExpiredBuckets(now);
    return true;
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    response.status(429).json({
      statusCode: 429,
      message: 'Too many requests. Please retry shortly.',
      error: 'Too Many Requests',
    });
    return false;
  }
  return true;
}

function limitFor(request: RequestLike): number {
  const path = request.path;
  if (path.includes('/auth/login') || path.includes('/auth/register') || path.includes('/auth/forgot-password')) {
    return strictLimit;
  }
  if (path.includes('/auth/profile-verification') || path.includes('/contact') || path.includes('/support')) {
    return strictLimit;
  }
  if (path.includes('/uploads')) {
    return uploadLimit;
  }
  if (path.includes('/payments') || path.includes('/tracking')) {
    return 60;
  }
  return defaultLimit;
}

function clientIp(request: RequestLike): string {
  const forwardedFor = request.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }
  return request.ip || request.socket.remoteAddress || 'unknown';
}

function normalizedPath(path: string): string {
  return path
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi, ':id')
    .replace(/\/[A-Za-z0-9_-]{16,}/g, '/:token');
}

function cleanupExpiredBuckets(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}
