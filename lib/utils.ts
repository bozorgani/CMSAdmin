import { IMAGE_EXTENSIONS } from './constants';
import type { ToastMessage, ToastType } from '@/types';

/**
 * Check if a file path points to an image
 */
export function isImage(path: string | undefined | null): boolean {
  if (!path) return false;
  return IMAGE_EXTENSIONS.test(path);
}

/**
 * Generate a slug from a string (Persian + English support)
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Replace Persian/Arabic characters with empty (since slug must be ASCII)
    .replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

/**
 * Truncate text to a max length with ellipsis
 */
export function truncate(text: string, maxLength: number, suffix = '...'): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Format a date string to Persian locale
 */
export function formatPersianDate(dateString: string | Date | undefined | null): string {
  if (!dateString) return '';
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('fa-IR');
  } catch {
    return '';
  }
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number | undefined | null): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Safely access localStorage (SSR safe)
 */
export function safeGetStorage(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSetStorage(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

export function safeRemoveStorage(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/**
 * Safely parse JSON
 */
export function safeJsonParse<T = unknown>(str: string | null, fallback: T): T {
  if (!str) return fallback;
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

/**
 * Get a value from a potentially-populated reference
 */
export function getRefId<T extends { _id: string }>(ref: string | T | undefined | null): string {
  if (!ref) return '';
  if (typeof ref === 'string') return ref;
  return ref._id;
}

export function getRefName<T extends { name?: string; slug?: string }>(ref: string | T | undefined | null, fallback = '—'): string {
  if (!ref) return fallback;
  if (typeof ref === 'string') return fallback;
  return ref.name || ref.slug || fallback;
}

/**
 * Create a unique ID
 */
export function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Build a toast message
 */
export function buildToast(type: ToastType, message: string, title?: string, duration = 4000): ToastMessage {
  return {
    id: createId(),
    type,
    message,
    title,
    duration,
  };
}

/**
 * Extract plain text from TipTap JSON content
 */
export interface TiptapNode {
  type: string;
  text?: string;
  content?: TiptapNode[];
}

export function extractTextFromContent(content: TiptapNode | null | undefined): string {
  if (!content) return '';
  if (typeof content === 'string') return content;
  if (!content.content || !Array.isArray(content.content)) return '';

  let text = '';
  function traverse(node: TiptapNode) {
    if (node.type === 'text' && node.text) {
      text += node.text + ' ';
    }
    if (node.content && Array.isArray(node.content)) {
      node.content.forEach(traverse);
    }
  }
  content.content.forEach(traverse);
  return text.trim();
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Classnames utility (replacement for classnames package)
 */
export function cn(...classes: Array<string | undefined | null | false | Record<string, boolean>>): string {
  const out: string[] = [];
  for (const c of classes) {
    if (!c) continue;
    if (typeof c === 'string') {
      out.push(c);
    } else if (typeof c === 'object') {
      for (const [key, value] of Object.entries(c)) {
        if (value) out.push(key);
      }
    }
  }
  return out.join(' ');
}
