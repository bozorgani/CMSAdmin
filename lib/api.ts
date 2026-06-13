import { API_BASE, API_PREFIX, USER_COOKIE_NAME, PUBLIC_BACKEND_URL } from './constants';
import { safeGetStorage, safeJsonParse } from './utils';
import type {
  ApiResponse,
  Category,
  CategoryInput,
  CategoryResponse,
  LoginResponse,
  Media,
  MediaResponse,
  PaginatedResponse,
  Post,
  PostInput,
  PostResponse,
  Tag,
  TagInput,
  TagResponse,
  User,
} from '@/types';

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

function buildUrl(path: string, query?: URLSearchParams): string {
  let url = `${API_BASE}${API_PREFIX}${path}`;
  if (query) {
    const qs = query.toString();
    if (qs) url += `?${qs}`;
  }
  return url;
}

async function handleResponse<T>(res: Response): Promise<T> {
  // 401 means cookie expired/invalid - redirect to login
  if (res.status === 401 && typeof window !== 'undefined') {
    // Clear local user cache and redirect
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    throw new ApiError('Session expired', 401);
  }

  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const error = (data as { error?: string })?.error || `HTTP ${res.status}`;
    throw new ApiError(error, res.status);
  }
  return data as T;
}

async function proxyFetch(
  path: string,
  options: RequestInit & { query?: URLSearchParams } = {}
): Promise<Response> {
  const { query, ...init } = options;
  return fetch(buildUrl(path, query), {
    ...init,
    credentials: 'include', // Always send HttpOnly cookie
    headers: {
      ...init.headers,
    },
  });
}

// ====== Auth ======

export async function login(email: string, password: string): Promise<LoginResponse> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });
    const data = await handleResponse<{ ok: boolean; user?: User; error?: string }>(res);
    return { ok: data.ok, user: data.user, error: data.error };
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, error: e.message };
    return { ok: false, error: 'خطا در ارتباط با سرور' };
  }
}

export async function logout(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    /* ignore network errors */
  }
  // Clear localStorage cache if any
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  // Read from non-httpOnly cookie (set by /api/auth/login)
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, ...rest] = cookie.trim().split('=');
    if (name === USER_COOKIE_NAME) {
      return safeJsonParse<User | null>(decodeURIComponent(rest.join('=')), null);
    }
  }
  // Fallback: check localStorage (in case cookies were cleared)
  return safeJsonParse<User | null>(safeGetStorage('cms-user'), null);
}

export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const res = await fetch('/api/auth/me', {
      credentials: 'include',
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.user || null;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  // We can check for the cookie presence, but it doesn't tell us if it's valid
  // The /api/auth/me endpoint will validate it
  return document.cookie.split(';').some((c) => c.trim().startsWith('cms-auth-token='));
}

// ====== Posts ======

export interface ListPostsParams {
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  tagId?: string;
}

export async function listPosts(params?: ListPostsParams): Promise<PaginatedResponse<Post>> {
  try {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.search) query.append('search', params.search);
    if (params?.categoryId) query.append('categoryId', params.categoryId);
    if (params?.tagId) query.append('tagId', params.tagId);

    const res = await proxyFetch('/posts', { query });
    return await handleResponse<PaginatedResponse<Post>>(res);
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, error: e.message };
    return { ok: false };
  }
}

export async function getPost(id: string): Promise<PostResponse> {
  try {
    const res = await proxyFetch(`/posts/${id}`);
    return await handleResponse<PostResponse>(res);
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, error: e.message };
    return { ok: false };
  }
}

export async function createPost(post: PostInput): Promise<PostResponse> {
  try {
    const res = await proxyFetch('/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(post),
    });
    return await handleResponse<PostResponse>(res);
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, error: e.message };
    return { ok: false, error: 'خطا در ارتباط با سرور' };
  }
}

export async function updatePost(id: string, post: Partial<PostInput>): Promise<PostResponse> {
  try {
    const res = await proxyFetch(`/posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(post),
    });
    return await handleResponse<PostResponse>(res);
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, error: e.message };
    return { ok: false, error: 'خطا در ارتباط با سرور' };
  }
}

export async function deletePost(id: string): Promise<ApiResponse> {
  try {
    const res = await proxyFetch(`/posts/${id}`, { method: 'DELETE' });
    return await handleResponse<ApiResponse>(res);
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, error: e.message };
    return { ok: false, error: 'خطا در ارتباط با سرور' };
  }
}

export async function publishPost(id: string, publishAt?: Date): Promise<PostResponse> {
  try {
    const res = await proxyFetch(`/posts/${id}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publishAt }),
    });
    return await handleResponse<PostResponse>(res);
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, error: e.message };
    return { ok: false, error: 'خطا در ارتباط با سرور' };
  }
}

// ====== Categories ======

export async function listCategories(
  params?: { page?: number; limit?: number }
): Promise<PaginatedResponse<Category>> {
  try {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));

    const res = await proxyFetch('/categories', { query });
    return await handleResponse<PaginatedResponse<Category>>(res);
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, error: e.message };
    return { ok: false };
  }
}

export async function getCategory(id: string): Promise<CategoryResponse> {
  try {
    const res = await proxyFetch(`/categories/${id}`);
    return await handleResponse<CategoryResponse>(res);
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, error: e.message };
    return { ok: false };
  }
}

export async function createCategory(category: CategoryInput): Promise<CategoryResponse> {
  try {
    const res = await proxyFetch('/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    });
    return await handleResponse<CategoryResponse>(res);
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, error: e.message };
    return { ok: false, error: 'خطا در ارتباط با سرور' };
  }
}

export async function updateCategory(
  id: string,
  category: Partial<CategoryInput>
): Promise<CategoryResponse> {
  try {
    const res = await proxyFetch(`/categories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    });
    return await handleResponse<CategoryResponse>(res);
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, error: e.message };
    return { ok: false, error: 'خطا در ارتباط با سرور' };
  }
}

export async function deleteCategory(id: string): Promise<ApiResponse> {
  try {
    const res = await proxyFetch(`/categories/${id}`, { method: 'DELETE' });
    return await handleResponse<ApiResponse>(res);
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, error: e.message };
    return { ok: false, error: 'خطا در ارتباط با سرور' };
  }
}

// ====== Tags ======

export async function listTags(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Tag>> {
  try {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));

    const res = await proxyFetch('/tags', { query });
    return await handleResponse<PaginatedResponse<Tag>>(res);
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, error: e.message };
    return { ok: false };
  }
}

export async function getTag(id: string): Promise<TagResponse> {
  try {
    const res = await proxyFetch(`/tags/${id}`);
    return await handleResponse<TagResponse>(res);
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, error: e.message };
    return { ok: false };
  }
}

export async function createTag(tag: TagInput): Promise<TagResponse> {
  try {
    const res = await proxyFetch('/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tag),
    });
    return await handleResponse<TagResponse>(res);
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, error: e.message };
    return { ok: false, error: 'خطا در ارتباط با سرور' };
  }
}

export async function updateTag(id: string, tag: Partial<TagInput>): Promise<TagResponse> {
  try {
    const res = await proxyFetch(`/tags/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tag),
    });
    return await handleResponse<TagResponse>(res);
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, error: e.message };
    return { ok: false, error: 'خطا در ارتباط با سرور' };
  }
}

export async function deleteTag(id: string): Promise<ApiResponse> {
  try {
    const res = await proxyFetch(`/tags/${id}`, { method: 'DELETE' });
    return await handleResponse<ApiResponse>(res);
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, error: e.message };
    return { ok: false, error: 'خطا در ارتباط با سرور' };
  }
}

// ====== Media ======

export async function listMedia(
  params?: { page?: number; limit?: number }
): Promise<PaginatedResponse<Media>> {
  try {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));

    const res = await proxyFetch('/media', { query });
    return await handleResponse<PaginatedResponse<Media>>(res);
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, error: e.message };
    return { ok: false };
  }
}

export async function getMedia(id: string): Promise<MediaResponse> {
  try {
    const res = await proxyFetch(`/media/${id}`);
    return await handleResponse<MediaResponse>(res);
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, error: e.message };
    return { ok: false };
  }
}

export async function uploadMedia(
  file: File,
  alt?: string,
  caption?: string
): Promise<MediaResponse> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (alt) formData.append('alt', alt);
    if (caption) formData.append('caption', caption);

    const res = await proxyFetch('/media', {
      method: 'POST',
      body: formData,
    });
    return await handleResponse<MediaResponse>(res);
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, error: e.message };
    return { ok: false, error: 'خطا در ارتباط با سرور' };
  }
}

export async function updateMedia(
  id: string,
  updates: { alt?: string; caption?: string }
): Promise<MediaResponse> {
  try {
    const res = await proxyFetch(`/media/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return await handleResponse<MediaResponse>(res);
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, error: e.message };
    return { ok: false, error: 'خطا در ارتباط با سرور' };
  }
}

export async function deleteMedia(id: string): Promise<ApiResponse> {
  try {
    const res = await proxyFetch(`/media/${id}`, { method: 'DELETE' });
    return await handleResponse<ApiResponse>(res);
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, error: e.message };
    return { ok: false, error: 'خطا در ارتباط با سرور' };
  }
}

export async function replaceMedia(
  id: string,
  file: File,
  alt?: string,
  caption?: string
): Promise<MediaResponse> {
  try {
    const form = new FormData();
    form.append('file', file);
    if (alt) form.append('alt', alt);
    if (caption) form.append('caption', caption);
    const res = await proxyFetch(`/media/${id}/replace`, {
      method: 'PUT',
      body: form,
    });
    return await handleResponse<MediaResponse>(res);
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, error: e.message };
    return { ok: false, error: 'خطا در ارتباط با سرور' };
  }
}

/**
 * Get the full URL for a media file.
 * Media files are typically public, so we fetch them directly from the backend
 * to benefit from browser caching and CDN support.
 */
export function getMediaUrl(path: string | undefined | null): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/api/proxy/')) return path; // already proxied
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${PUBLIC_BACKEND_URL}${cleanPath}`;
}

// ====== Auth helpers used by LoginPage ======
export function saveAuth(token: string, user?: User): void {
  // In HttpOnly cookie mode, this is a no-op on the client.
  // The server route /api/auth/login handles cookie setting.
  // Kept for backwards compatibility.
  if (typeof window !== 'undefined' && user) {
    // Store user info in a non-httpOnly cookie for client-side display
    document.cookie = `${USER_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  }
  // Also keep in localStorage as backup
  if (typeof window !== 'undefined') {
    if (user) safeGetStorage; // dummy for ts
    // Store user in localStorage too for offline cases
    try {
      localStorage.setItem('cms-user', JSON.stringify(user));
    } catch {
      /* ignore */
    }
  }
  // Note: token is NOT stored on client anymore
  void token;
}
