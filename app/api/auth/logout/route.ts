import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, USER_COOKIE_NAME, TOTP_COOKIE_NAME, PENDING_COOKIE_NAME } from '@/lib/constants';
import { notify } from '@/lib/notify';

function getClientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = getClientIp(request);
  const userCookie = request.cookies.get(USER_COOKIE_NAME)?.value;
  let account = 'unknown';
  try {
    if (userCookie) {
      const user = JSON.parse(userCookie);
      account = user.email || user.name || 'unknown';
    }
  } catch {
    /* ignore */
  }

  const res = NextResponse.json({ ok: true });

  // Clear all auth-related cookies
  const clearOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
  };
  const clearOptionsNonHttpOnly = { ...clearOptions, httpOnly: false };

  res.cookies.set(AUTH_COOKIE_NAME, '', clearOptions);
  res.cookies.set(USER_COOKIE_NAME, '', clearOptionsNonHttpOnly);
  res.cookies.set(TOTP_COOKIE_NAME, '', clearOptions);
  res.cookies.set(PENDING_COOKIE_NAME, '', clearOptions);
  res.cookies.set('totp-setup-temp', '', clearOptions);

  await notify({
    type: 'login_success',
    user: account,
    ip,
    details: '🚪 خروج از سیستم',
  });

  return res;
}
