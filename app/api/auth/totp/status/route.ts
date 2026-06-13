import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, TOTP_COOKIE_NAME } from '@/lib/constants';

/**
 * Check if 2FA is enabled for the current user
 * Used by the login page to determine if it should show the TOTP input
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const totpEnabled = !!request.cookies.get(TOTP_COOKIE_NAME)?.value;

  return NextResponse.json({
    ok: true,
    authenticated: !!token,
    twoFactorEnabled: totpEnabled,
  });
}
