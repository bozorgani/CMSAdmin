import crypto from 'crypto';

// Use a strong key from environment, with a fallback that's randomized per process
// In production, ALWAYS set CMS_ENCRYPTION_KEY in .env.local
const ENCRYPTION_KEY = process.env.CMS_ENCRYPTION_KEY
  ? Buffer.from(process.env.CMS_ENCRYPTION_KEY, 'hex')
  : crypto.randomBytes(32);

if (ENCRYPTION_KEY.length !== 32) {
  throw new Error(
    'CMS_ENCRYPTION_KEY must be a 64-character hex string (32 bytes). Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
  );
}

/**
 * Encrypts text using AES-256-GCM
 * Returns iv:authTag:encrypted (all hex)
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypts text encrypted with AES-256-GCM
 */
export function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted format');
  }
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = Buffer.from(parts[2], 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

/**
 * Hash text with salt (for storage of sensitive non-reversible data)
 */
export function hash(text: string, salt?: string): string {
  const useSalt = salt || crypto.randomBytes(16).toString('hex');
  const hashValue = crypto.pbkdf2Sync(text, useSalt, 100000, 64, 'sha512').toString('hex');
  return `${useSalt}:${hashValue}`;
}

/**
 * Verify a hash
 */
export function verifyHash(text: string, hashed: string): boolean {
  const parts = hashed.split(':');
  if (parts.length !== 2) return false;
  const testHash = hash(text, parts[0]);
  return crypto.timingSafeEqual(Buffer.from(testHash), Buffer.from(hashed));
}

/**
 * Generate a secure random token
 */
export function generateToken(length = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a TOTP-style base32 secret
 */
export function generateSecret(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const buffer = crypto.randomBytes(length);
  let secret = '';
  for (let i = 0; i < length; i++) {
    secret += chars[buffer[i] % chars.length];
  }
  return secret;
}
