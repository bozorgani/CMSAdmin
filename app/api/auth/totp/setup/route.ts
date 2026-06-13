import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, USER_COOKIE_NAME, TOTP_COOKIE_NAME } from '@/lib/constants';
import { generateTOTPSecret, generateTOTPUri, formatSecret, generateBackupCodes } from '@/lib/totp';
import { encrypt } from '@/lib/crypto';
import { notify } from '@/lib/notify';

const BACKEND_URL = process.env.CMS_API_URL || process.env.NEXT_PUBLIC_CMS_API || 'http://localhost:4000';

function getClientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

/**
 * Generate a new TOTP secret and return it with QR URI
 * The secret is stored temporarily in a non-encrypted cookie for QR display
 * User must verify with a code before it's permanently stored (encrypted)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = getClientIp(request);
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const userCookie = request.cookies.get(USER_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ ok: false, error: 'ابتدا وارد شوید' }, { status: 401 });
  }

  let user: { email?: string; name?: string } = {};
  try {
    if (userCookie) user = JSON.parse(userCookie);
  } catch {
    /* ignore */
  }

  const account = user.email || user.name || 'admin';

  // Generate new secret
  const secret = generateTOTPSecret(32);
  const uri = generateTOTPUri(secret, account, 'CMS Admin');
  const backupCodes = generateBackupCodes(10, 8);

  // Store temporarily (10 minutes) in plain text for the user to verify
  // Once verified, we'll encrypt and store permanently
  const res = NextResponse.json({
    ok: true,
    secret,
    uri,
    formattedSecret: formatSecret(secret),
    backupCodes,
    account,
    issuer: 'CMS Admin',
  });

  res.cookies.set('totp-setup-temp', secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 10 * 60, // 10 minutes
  });

  await notify({
    type: '2fa_enabled',
    user: account,
    ip,
    details: 'در حال فعال‌سازی',
  });

  return res;
}
