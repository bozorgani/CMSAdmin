import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, USER_COOKIE_NAME, TOTP_COOKIE_NAME } from '@/lib/constants';
import { verifyTOTP } from '@/lib/totp';
import { decrypt } from '@/lib/crypto';
import { notify } from '@/lib/notify';

function getClientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

/**
 * Disable 2FA - requires current TOTP code for security
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = getClientIp(request);
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const userCookie = request.cookies.get(USER_COOKIE_NAME)?.value;
  const totpSecretEncrypted = request.cookies.get(TOTP_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ ok: false, error: 'ابتدا وارد شوید' }, { status: 401 });
  }

  if (!totpSecretEncrypted) {
    return NextResponse.json({ ok: false, error: '۲FA فعال نیست' }, { status: 400 });
  }

  let body: { code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'درخواست نامعتبر' }, { status: 400 });
  }

  const { code } = body;
  if (!code) {
    return NextResponse.json(
      { ok: false, error: 'برای غیرفعال کردن، کد تأیید فعلی را وارد کنید' },
      { status: 400 }
    );
  }

  // Verify current TOTP code
  let totpSecret: string;
  try {
    totpSecret = decrypt(totpSecretEncrypted);
  } catch {
    return NextResponse.json(
      { ok: false, error: 'خطا در تأیید. لطفاً دوباره وارد شوید.' },
      { status: 500 }
    );
  }

  if (!verifyTOTP(totpSecret, code)) {
    return NextResponse.json(
      { ok: false, error: 'کد تأیید اشتباه است' },
      { status: 401 }
    );
  }

  // Verified - disable 2FA
  const res = NextResponse.json({
    ok: true,
    message: '۲FA غیرفعال شد',
  });

  res.cookies.set(TOTP_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  let account = 'admin';
  try {
    if (userCookie) {
      const user = JSON.parse(userCookie);
      account = user.email || user.name || 'admin';
    }
  } catch {
    /* ignore */
  }

  await notify({
    type: '2fa_disabled',
    user: account,
    ip,
    details: 'کاربر درخواست غیرفعال‌سازی داد',
  });

  return res;
}
