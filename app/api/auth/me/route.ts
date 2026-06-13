import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, USER_COOKIE_NAME } from '@/lib/constants';

const BACKEND_URL = process.env.CMS_API_URL || process.env.NEXT_PUBLIC_CMS_API || 'http://localhost:4000';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });
  }

  // Try to read user info from non-httpOnly cookie (set at login)
  const userCookie = request.cookies.get(USER_COOKIE_NAME)?.value;
  let user = null;
  if (userCookie) {
    try {
      user = JSON.parse(userCookie);
    } catch {
      /* ignore */
    }
  }

  // Optionally re-validate token with backend
  if (process.env.CMS_VALIDATE_TOKEN !== 'false') {
    try {
      const response = await fetch(`${BACKEND_URL}/v1/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });

      if (!response.ok) {
        // Token invalid - clear cookies
        const res = NextResponse.json(
          { ok: false, error: 'Session expired' },
          { status: 401 }
        );
        res.cookies.delete(AUTH_COOKIE_NAME);
        res.cookies.delete(USER_COOKIE_NAME);
        return res;
      }

      const data = await response.json();
      return NextResponse.json({ ok: true, user: data.user || data || user });
    } catch (error) {
      // If backend is unreachable but we have a cached user, return it
      if (user) {
        return NextResponse.json({ ok: true, user });
      }
      // eslint-disable-next-line no-console
      console.error('[Auth Me]', error);
      return NextResponse.json(
        { ok: false, error: 'خطا در اعتبارسنجی' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ ok: true, user });
}
