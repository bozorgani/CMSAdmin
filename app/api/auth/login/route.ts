import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, USER_COOKIE_NAME, TOTP_COOKIE_NAME, PENDING_COOKIE_NAME } from '@/lib/constants';
import { verifyTOTP } from '@/lib/totp';
import { decrypt } from '@/lib/crypto';
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit';
import { notify } from '@/lib/notify';

const BACKEND_URL = process.env.CMS_API_URL || process.env.NEXT_PUBLIC_CMS_API || 'http://localhost:4000';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

function getClientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

function buildAuthResponse(data: { token: string; user?: unknown }) {
  const res = NextResponse.json({
    ok: true,
    user: data.user,
  });

  res.cookies.set(AUTH_COOKIE_NAME, data.token, {
    ...COOKIE_OPTIONS,
    maxAge: 60 * 60 * 4, // 4 hours for security
  });

  if (data.user) {
    res.cookies.set(USER_COOKIE_NAME, JSON.stringify(data.user), {
      ...COOKIE_OPTIONS,
      httpOnly: false, // User info readable by JS for UI
      maxAge: 60 * 60 * 4,
    });
  }

  return res;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';

  let body: { email?: string; password?: string; totpCode?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'درخواست نامعتبر' }, { status: 400 });
  }

  const { email, password, totpCode } = body;

  if (!email || !password) {
    return NextResponse.json({ ok: false, error: 'ایمیل و رمز عبور الزامی است' }, { status: 400 });
  }

  // ====== Rate Limiting ======
  const rateLimitKey = `login:${ip}:${email.toLowerCase()}`;
  const rateCheck = checkRateLimit(rateLimitKey, {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000,
    lockoutMs: 30 * 60 * 1000, // 30 minutes lockout after 5 failures
  });

  if (!rateCheck.allowed) {
    await notify({
      type: 'login_failed',
      user: email,
      ip,
      userAgent,
      details: `Rate limit - قفل شده تا ${Math.ceil((rateCheck.retryAfter || 0) / 60)} دقیقه دیگر`,
    });

    return NextResponse.json(
      {
        ok: false,
        error: `تعداد تلاش‌های ناموفق زیاد است. لطفاً ${Math.ceil((rateCheck.retryAfter || 0) / 60)} دقیقه دیگر تلاش کنید.`,
        retryAfter: rateCheck.retryAfter,
      },
      { status: 429 }
    );
  }

  // ====== Step 1: Verify password with backend ======
  try {
    const response = await fetch(`${BACKEND_URL}/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    });

    const data = await response.json();

    if (!response.ok || !data?.token) {
      // Failed login - record rate limit and notify
      await notify({
        type: 'login_failed',
        user: email,
        ip,
        userAgent,
        details: data?.error || 'Backend rejected credentials',
      });

      return NextResponse.json(
        { ok: false, error: data?.error || 'ایمیل یا رمز عبور اشتباه است' },
        { status: response.status || 401 }
      );
    }

    // ====== Step 2: Check if 2FA is enabled ======
    const totpSecretEncrypted = request.cookies.get(TOTP_COOKIE_NAME)?.value;

    if (totpSecretEncrypted) {
      // 2FA is enabled - require TOTP code
      if (!totpCode) {
        // Set pending cookie (5 min expiry) holding the token
        const res = NextResponse.json({
          ok: true,
          requires2fa: true,
          message: 'کد تأیید دو مرحله‌ای را وارد کنید',
        });
        res.cookies.set(PENDING_COOKIE_NAME, data.token, {
          ...COOKIE_OPTIONS,
          maxAge: 5 * 60, // 5 minutes
        });
        return res;
      }

      // Verify TOTP code
      let totpSecret: string;
      try {
        totpSecret = decrypt(totpSecretEncrypted);
      } catch {
        // Secret corrupted - force re-setup
        return NextResponse.json(
          {
            ok: false,
            error: 'خطا در تأیید دو مرحله‌ای. لطفاً با پشتیبانی تماس بگیرید.',
          },
          { status: 500 }
        );
      }

      if (!verifyTOTP(totpSecret, totpCode)) {
        await notify({
          type: 'login_failed',
          user: email,
          ip,
          userAgent,
          details: 'کد 2FA نامعتبر',
        });

        return NextResponse.json(
          { ok: false, error: 'کد تأیید دو مرحله‌ای اشتباه است' },
          { status: 401 }
        );
      }

      // TOTP verified! Clear pending cookie and set auth cookie
      const authRes = buildAuthResponse(data);
      authRes.cookies.delete(PENDING_COOKIE_NAME);

      // Success notification
      resetRateLimit(rateLimitKey);
      await notify({
        type: 'login_success',
        user: email,
        ip,
        userAgent,
        details: 'با 2FA',
      });

      return authRes;
    }

    // ====== No 2FA - Set auth cookie directly ======
    resetRateLimit(rateLimitKey);
    await notify({
      type: 'login_success',
      user: email,
      ip,
      userAgent,
      details: 'بدون 2FA',
    });

    return buildAuthResponse(data);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Auth Login]', error);

    await notify({
      type: 'suspicious_activity',
      user: email,
      ip,
      userAgent,
      details: `Backend error: ${(error as Error).message}`,
    });

    return NextResponse.json(
      { ok: false, error: 'خطا در ارتباط با سرور' },
      { status: 500 }
    );
  }
}
