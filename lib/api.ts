const API_BASE = process.env.NEXT_PUBLIC_CMS_API || 'http://localhost:4000';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export async function login(email: string, password: string): Promise<{ ok: boolean; token?: string; user?: any; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data?.error || 'failed' };
    return { ok: true, token: data.token, user: data.user };
  } catch (e) {
    return { ok: false, error: 'network error' };
  }
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
}

export function getCurrentUser() {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('token');
}

export async function listPosts(params?: { status?: string; page?: number; limit?: number }): Promise<{ ok: boolean; items?: any[]; total?: number; page?: number }> {
  try {
    const token = getToken();
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    const res = await fetch(`${API_BASE}/v1/posts?${query.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    });
    const data = await res.json();
    if (!res.ok) return { ok: false };
    return { ok: true, items: data.items || [], total: data.total, page: data.page };
  } catch (e) {
    return { ok: false };
  }
}

export async function getPost(id: string): Promise<{ ok: boolean; post?: any }> {
  try {
    const token = getToken();
    const res = await fetch(`${API_BASE}/v1/posts/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    });
    const data = await res.json();
    if (!res.ok) return { ok: false };
    return { ok: true, post: data };
  } catch (e) {
    return { ok: false };
  }
}

export async function createPost(post: any): Promise<{ ok: boolean; post?: any; error?: string }> {
  try {
    const token = getToken();
    const res = await fetch(`${API_BASE}/v1/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(post)
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data?.error || 'Failed to create post' };
    return { ok: true, post: data };
  } catch (e) {
    return { ok: false, error: 'Network error' };
  }
}

export async function updatePost(id: string, post: any): Promise<{ ok: boolean; post?: any; error?: string }> {
  try {
    const token = getToken();
    const res = await fetch(`${API_BASE}/v1/posts/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(post)
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data?.error || 'Failed to update post' };
    return { ok: true, post: data };
  } catch (e) {
    return { ok: false, error: 'Network error' };
  }
}

export async function deletePost(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const token = getToken();
    const res = await fetch(`${API_BASE}/v1/posts/${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    });
    if (!res.ok) {
      const data = await res.json();
      return { ok: false, error: data?.error || 'Failed to delete post' };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: 'Network error' };
  }
}

export async function publishPost(id: string, publishAt?: Date): Promise<{ ok: boolean; post?: any; error?: string }> {
  try {
    const token = getToken();
    const res = await fetch(`${API_BASE}/v1/posts/${id}/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ publishAt })
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data?.error || 'Failed to publish post' };
    return { ok: true, post: data };
  } catch (e) {
    return { ok: false, error: 'Network error' };
  }
}

// Categories
export async function listCategories(): Promise<{ ok: boolean; items?: any[] }> {
  try {
    const token = getToken();
    const res = await fetch(`${API_BASE}/v1/categories`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    });
    const data = await res.json();
    if (!res.ok) return { ok: false };
    return { ok: true, items: data.items || [] };
  } catch (e) {
    return { ok: false };
  }
}

export async function getCategory(id: string): Promise<{ ok: boolean; category?: any }> {
  try {
    const token = getToken();
    const res = await fetch(`${API_BASE}/v1/categories/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    });
    const data = await res.json();
    if (!res.ok) return { ok: false };
    return { ok: true, category: data };
  } catch (e) {
    return { ok: false };
  }
}

export async function createCategory(category: any): Promise<{ ok: boolean; category?: any; error?: string }> {
  try {
    const token = getToken();
    const res = await fetch(`${API_BASE}/v1/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(category)
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data?.error || 'Failed to create category' };
    return { ok: true, category: data };
  } catch (e) {
    return { ok: false, error: 'Network error' };
  }
}

export async function updateCategory(id: string, category: any): Promise<{ ok: boolean; category?: any; error?: string }> {
  try {
    const token = getToken();
    const res = await fetch(`${API_BASE}/v1/categories/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(category)
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data?.error || 'Failed to update category' };
    return { ok: true, category: data };
  } catch (e) {
    return { ok: false, error: 'Network error' };
  }
}

export async function deleteCategory(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const token = getToken();
    const res = await fetch(`${API_BASE}/v1/categories/${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    });
    if (!res.ok) {
      const data = await res.json();
      return { ok: false, error: data?.error || 'Failed to delete category' };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: 'Network error' };
  }
}

// Tags
export async function listTags(): Promise<{ ok: boolean; items?: any[] }> {
  try {
    const token = getToken();
    const res = await fetch(`${API_BASE}/v1/tags`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    });
    const data = await res.json();
    if (!res.ok) return { ok: false };
    return { ok: true, items: data.items || [] };
  } catch (e) {
    return { ok: false };
  }
}

export async function getTag(id: string): Promise<{ ok: boolean; tag?: any }> {
  try {
    const token = getToken();
    const res = await fetch(`${API_BASE}/v1/tags/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    });
    const data = await res.json();
    if (!res.ok) return { ok: false };
    return { ok: true, tag: data };
  } catch (e) {
    return { ok: false };
  }
}

export async function createTag(tag: any): Promise<{ ok: boolean; tag?: any; error?: string }> {
  try {
    const token = getToken();
    const res = await fetch(`${API_BASE}/v1/tags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(tag)
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data?.error || 'Failed to create tag' };
    return { ok: true, tag: data };
  } catch (e) {
    return { ok: false, error: 'Network error' };
  }
}

export async function updateTag(id: string, tag: any): Promise<{ ok: boolean; tag?: any; error?: string }> {
  try {
    const token = getToken();
    const res = await fetch(`${API_BASE}/v1/tags/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(tag)
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data?.error || 'Failed to update tag' };
    return { ok: true, tag: data };
  } catch (e) {
    return { ok: false, error: 'Network error' };
  }
}

export async function deleteTag(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const token = getToken();
    const res = await fetch(`${API_BASE}/v1/tags/${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    });
    if (!res.ok) {
      const data = await res.json();
      return { ok: false, error: data?.error || 'Failed to delete tag' };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: 'Network error' };
  }
}

// Media
export async function listMedia(params?: { page?: number; limit?: number }): Promise<{ ok: boolean; items?: any[]; total?: number; page?: number }> {
  try {
    const token = getToken();
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    const res = await fetch(`${API_BASE}/v1/media?${query.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    });
    const data = await res.json();
    if (!res.ok) return { ok: false };
    return { ok: true, items: data.items || [], total: data.total, page: data.page };
  } catch (e) {
    return { ok: false };
  }
}

export async function getMedia(id: string): Promise<{ ok: boolean; media?: any }> {
  try {
    const token = getToken();
    const res = await fetch(`${API_BASE}/v1/media/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    });
    const data = await res.json();
    if (!res.ok) return { ok: false };
    return { ok: true, media: data };
  } catch (e) {
    return { ok: false };
  }
}

export async function uploadMedia(file: File, alt?: string, caption?: string): Promise<{ ok: boolean; media?: any; error?: string }> {
  try {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    if (alt) formData.append('alt', alt);
    if (caption) formData.append('caption', caption);
    
    const res = await fetch(`${API_BASE}/v1/media`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data?.error || 'Failed to upload media' };
    return { ok: true, media: data };
  } catch (e) {
    return { ok: false, error: 'Network error' };
  }
}

export async function updateMedia(id: string, updates: { alt?: string; caption?: string }): Promise<{ ok: boolean; media?: any; error?: string }> {
  try {
    const token = getToken();
    const res = await fetch(`${API_BASE}/v1/media/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data?.error || 'Failed to update media' };
    return { ok: true, media: data };
  } catch (e) {
    return { ok: false, error: 'Network error' };
  }
}

export async function deleteMedia(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const token = getToken();
    const res = await fetch(`${API_BASE}/v1/media/${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    });
    if (!res.ok) {
      const data = await res.json();
      return { ok: false, error: data?.error || 'Failed to delete media' };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: 'Network error' };
  }
}

export function getMediaUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const apiBase = process.env.NEXT_PUBLIC_CMS_API || 'http://localhost:4000';
  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${apiBase}${cleanPath}`;
}

export async function replaceMedia(
  id: string,
  file: File,
  alt?: string,
  caption?: string
): Promise<{ ok: boolean; media?: any; error?: string }> {
  try {
    const token = getToken();
    const form = new FormData();
    form.append('file', file);
    if (alt) form.append('alt', alt);
    if (caption) form.append('caption', caption);
    const res = await fetch(`${API_BASE}/v1/media/${id}/replace`, {
      method: 'PUT',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data?.error || 'Failed to replace media' };
    return { ok: true, media: data };
  } catch (e) {
    return { ok: false, error: 'Network error' };
  }
}


