import crypto from 'crypto';

/**
 * TOTP (Time-based One-Time Password) implementation following RFC 6238
 * Compatible with Google Authenticator, Authy, 1Password, etc.
 */

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Decode(secret: string): Buffer {
  const cleanSecret = secret.replace(/[^A-Z2-7]/gi, '').toUpperCase();
  let bits = '';
  for (const char of cleanSecret) {
    const val = BASE32_CHARS.indexOf(char.toUpperCase());
    if (val === -1) {
      throw new Error(`Invalid base32 character: ${char}`);
    }
    bits += val.toString(2).padStart(5, '0');
  }

  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function hotp(secretBuffer: Buffer, counter: number, digits = 6): string {
  const buf = Buffer.alloc(8);
  let c = counter;
  for (let i = 7; i >= 0; i--) {
    buf[i] = c & 0xff;
    c = Math.floor(c / 256);
  }
  const hmac = crypto.createHmac('sha1', secretBuffer).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return (code % Math.pow(10, digits)).toString().padStart(digits, '0');
}

/**
 * Generate a TOTP code for the given secret at the current time
 */
export function generateTOTP(secret: string, time = Date.now(), digits = 6): string {
  const counter = Math.floor(time / 1000 / 30);
  return hotp(base32Decode(secret), counter, digits);
}

/**
 * Verify a TOTP code with a window of ±window steps (default 1 = 30s window each side)
 * Returns true if the code matches any code within the window
 */
export function verifyTOTP(secret: string, code: string, window = 1, digits = 6): boolean {
  // Sanitize code - only allow digits
  const cleanCode = code.replace(/\D/g, '');
  if (cleanCode.length !== digits) return false;

  const counter = Math.floor(Date.now() / 1000 / 30);
  const secretBuffer = base32Decode(secret);

  for (let i = -window; i <= window; i++) {
    try {
      if (hotp(secretBuffer, counter + i, digits) === cleanCode) {
        return true;
      }
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Generate a TOTP URI for QR code (otpauth://)
 * Format: otpauth://totp/Issuer:Account?secret=SECRET&issuer=Issuer&algorithm=SHA1&digits=6&period=30
 */
export function generateTOTPUri(secret: string, account: string, issuer = 'CMS Admin'): string {
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: '6',
    period: '30',
  });
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?${params.toString()}`;
}

/**
 * Generate a random base32 secret for TOTP
 */
export function generateTOTPSecret(length = 32): string {
  const buffer = crypto.randomBytes(length);
  let secret = '';
  for (let i = 0; i < length; i++) {
    secret += BASE32_CHARS[buffer[i] % BASE32_CHARS.length];
  }
  return secret;
}

/**
 * Format a base32 secret with spaces every 4 chars for readability
 */
export function formatSecret(secret: string): string {
  return secret.match(/.{1,4}/g)?.join(' ') || secret;
}

/**
 * Backup codes (recovery codes) generator
 */
export function generateBackupCodes(count = 10, length = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(length).toString('hex').slice(0, length).toUpperCase();
    codes.push(code.match(/.{1,4}/g)?.join('-') || code);
  }
  return codes;
}
