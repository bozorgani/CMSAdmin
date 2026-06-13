import { NextRequest, NextResponse } from 'next/server';

// ====== IP Allowlist ======
// Comma-separated list of allowed IPs
// Examples: "1.2.3.4,5.6.7.8" or leave empty to allow all
const ALLOWED_IPS = (process.env.ALLOWED_IPS || '')
  .split(',')
  .map((ip) => ip.trim())
  .filter(Boolean);

// ====== Trusted Proxies ======
// If behind a proxy/CDN, set TRUSTED_PROXY=true to use x-forwarded-for
const TRUST_PROXY = process.env.TRUST_PROXY === 'true';

function getClientIp(request: NextRequest): string {
  if (TRUST_PROXY) {
    const xff = request.headers.get('x-forwarded-for');
    if (xff) return xff.split(',')[0].trim();
    const realIp = request.headers.get('x-real-ip');
    if (realIp) return realIp;
  }
  return 'unknown';
}

// ====== Security Headers ======
const SECURITY_HEADERS = {
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  // XSS protection (legacy, but still useful)
  'X-XSS-Protection': '1; mode=block',
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // Permissions policy
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  // Strict transport security (only in production with HTTPS)
  ...(process.env.NODE_ENV === 'production'
    ? {
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      }
    : {}),
};

function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files, public assets, etc.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return NextResponse.next();
  }

  // ====== IP Allowlist ======
  if (ALLOWED_IPS.length > 0) {
    const ip = getClientIp(request);

    if (!ALLOWED_IPS.includes(ip) && ip !== 'unknown') {
      // Log the blocked attempt
      // eslint-disable-next-line no-console
      console.warn(`[Security] Blocked request from IP ${ip} to ${pathname}`);

      return NextResponse.json(
        { ok: false, error: 'دسترسی از این IP مجاز نیست' },
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  }

  // ====== Apply Security Headers ======
  const response = NextResponse.next();
  return applySecurityHeaders(response);
}

export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
