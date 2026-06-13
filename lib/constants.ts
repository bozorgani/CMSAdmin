// API configuration
// In Next.js, anything prefixed with NEXT_PUBLIC_ is exposed to the browser.
// For security, we keep the actual backend URL server-side only.
const SERVER_BACKEND = process.env.CMS_API_URL || 'http://localhost:4000';
const PUBLIC_BACKEND = process.env.NEXT_PUBLIC_CMS_API || SERVER_BACKEND;

// Use proxy routes - the cookie is automatically sent with same-origin requests
// This way the auth token never reaches JavaScript (XSS-safe)
export const API_BASE = '/api/proxy';
export const API_PREFIX = '/v1';
export const BACKEND_URL = SERVER_BACKEND; // For server-side use only
export const PUBLIC_BACKEND_URL = PUBLIC_BACKEND; // Fallback for direct media URLs

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

export const POST_STATUS_LABELS: Record<string, string> = {
  draft: 'پیش‌نویس',
  scheduled: 'زمان‌بندی شده',
  published: 'منتشر شده',
  archived: 'آرشیو شده',
};

export const POST_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  scheduled: 'bg-yellow-100 text-yellow-800',
  published: 'bg-green-100 text-green-800',
  archived: 'bg-red-100 text-red-800',
};

export const ROBOTS_OPTIONS = [
  { value: 'index, follow', label: 'index, follow' },
  { value: 'noindex, follow', label: 'noindex, follow' },
  { value: 'index, nofollow', label: 'index, nofollow' },
  { value: 'noindex, nofollow', label: 'noindex, nofollow' },
];

export const SCHEMA_TYPES = [
  { value: 'Article', label: 'Article' },
  { value: 'BlogPosting', label: 'BlogPosting' },
  { value: 'NewsArticle', label: 'NewsArticle' },
];

export const TWITTER_CARDS = [
  { value: 'summary', label: 'summary' },
  { value: 'summary_large_image', label: 'summary_large_image' },
];

export const SEO_LIMITS = {
  META_TITLE_MIN: 30,
  META_TITLE_MAX: 60,
  META_DESCRIPTION_MIN: 120,
  META_DESCRIPTION_MAX: 160,
};

// Image MIME types
export const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i;

// Token storage keys - no longer used for auth token (HttpOnly cookie handles it)
// Kept for backwards compatibility / future non-sensitive storage
export const STORAGE_KEYS = {
  TOKEN: 'cms-auth-token', // Legacy - no longer used, see HttpOnly cookie
  USER: 'cms-user',
  SETTINGS: 'cms-settings',
  DRAFT_PREFIX: 'post-draft-',
} as const;

// Cookie names (server-readable)
export const AUTH_COOKIE_NAME = 'cms-auth-token';
export const USER_COOKIE_NAME = 'cms-user';

// 2FA cookies
export const TOTP_COOKIE_NAME = 'cms-totp-secret'; // Encrypted TOTP secret
export const PENDING_COOKIE_NAME = 'cms-auth-pending'; // Token pending 2FA verification
