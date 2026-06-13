import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, USER_COOKIE_NAME, TOTP_COOKIE_NAME } from '@/lib/constants';
import { verifyTOTP } from '@/lib/totp';
import { encrypt } from '@/lib/crypto';
import { notify } from '@/lib/notify';

function getClientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

/**
 * Verify a TOTP code and permanently store the secret (encrypted)
 * This is called after /api/auth/totp/setup to confirm the user
 * has correctly scanned the QR code
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = getClientIp(request);
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const userCookie = request.cookies.get(USER_COOKIE_NAME)?.value;
  const tempSecret = request.cookies.get('totp-setup-temp')?.value;

  if (!token) {
    return NextResponse.json({ ok: false, error: 'ابتدا وارد شوید' }, { status: 401 });
  }

  if (!tempSecret) {
    return NextResponse.json(
      { ok: false, error: 'ابتدا باید کد QR را اسکن کنید' },
      { status: 400 }
    );
  }

  let body: { code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'درخواست نامعتبر' }, { status: 400 });
  }

  const { code } = body;
  if (!code || code.replace(/\D/g, '').length !== 6) {
    return NextResponse.json(
      { ok: false, error: 'کد ۶ رقمی وارد کنید' },
      { status: 400 }
    );
  }

  // Verify the code against the temp secret
  if (!verifyTOTP(tempSecret, code)) {
    return NextResponse.json(
      { ok: false, error: 'کد اشتباه است. مطمئن شوید زمان دستگاه شما درست است' },
      { status: 401 }
    );
  }

  // Code verified! Encrypt and store permanently
  const encryptedSecret = encrypt(tempSecret);

  const res = NextResponse.json({
    ok: true,
    message: '۲FA با موفقیت فعال شد',
  });

  res.cookies.set(TOTP_COOKIE_NAME, encryptedSecret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });

  // Clear temp cookie
  res.cookies.set('totp-setup-temp', '', {
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
    type: '2fa_enabled',
    user: account,
    ip,
    details: 'تأیید شد و فعال گردید',
  });

  return res;
}
