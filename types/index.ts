// User types
export interface User {
  _id: string;
  email: string;
  name?: string;
  role?: string;
  avatar?: string;
}

// Auth types
export interface LoginResponse {
  ok: boolean;
  token?: string;
  user?: User;
  error?: string;
}

// Common API response - The backend returns data inline (e.g. { post }, { category })
// We use a flexible index signature so callers can access response.post, response.category, etc.
export interface ApiResponse<T = unknown> {
  ok: boolean;
  error?: string;
  data?: T;
  [key: string]: unknown;
}

// Specialized response types for endpoints that return a single entity
export interface PostResponse extends ApiResponse {
  post?: Post;
}

export interface CategoryResponse extends ApiResponse {
  category?: Category;
}

export interface TagResponse extends ApiResponse {
  tag?: Tag;
}

export interface MediaResponse extends ApiResponse {
  media?: Media;
}

// Pagination
export interface PaginatedResponse<T> {
  ok: boolean;
  items?: T[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  error?: string;
}

// SEO
export interface SEO {
  metaTitle?: string;
  metaDescription?: string;
  robots?: 'index, follow' | 'noindex, follow' | 'index, nofollow' | 'noindex, nofollow';
  ogTitle?: string;
  ogDescription?: string;
  ogImageId?: string | MediaRef;
  twitterCard?: 'summary' | 'summary_large_image';
  schemaType?: 'Article' | 'BlogPosting' | 'NewsArticle';
}

// Reference to another entity (populated or not)
export interface MediaRef {
  _id: string;
  path: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
  url?: string;
  mime?: string;
  size?: number;
}

export interface CategoryRef {
  _id: string;
  name: string;
  slug: string;
}

export interface TagRef {
  _id: string;
  name: string;
  slug: string;
}

// Category
export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string | CategoryRef;
  seo?: SEO;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryInput {
  name: string;
  slug?: string;
  description?: string;
  parentId?: string;
  seo?: SEO;
}

// Tag
export interface Tag {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TagInput {
  name: string;
  slug?: string;
  description?: string;
}

// Media
export interface Media {
  _id: string;
  path: string;
  url?: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
  mime?: string;
  size?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Post
export type PostStatus = 'draft' | 'scheduled' | 'published' | 'archived';

export interface Post {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: TiptapContent | null;
  status: PostStatus;
  publishAt?: string;
  createdAt?: string;
  updatedAt?: string;
  categoryId?: string | CategoryRef;
  categoryIds?: (string | CategoryRef)[];
  tags?: (string | TagRef)[];
  keywords?: string[];
  coverImageId?: string | MediaRef;
  canonicalUrl?: string;
  isFeatured?: boolean;
  readingTime?: number;
  views?: number;
  seo?: SEO;
  author?: User | string;
}

// Post input for create/update
export interface PostInput {
  title: string;
  slug: string;
  excerpt?: string;
  content: TiptapContent | null;
  status: PostStatus;
  publishAt?: string;
  categoryId?: string;
  categoryIds?: string[];
  tags?: string[];
  keywords?: string[];
  coverImageId?: string;
  canonicalUrl?: string;
  isFeatured?: boolean;
  seo?: SEO;
}

// Tiptap content JSON
export interface TiptapMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  marks?: TiptapMark[];
  text?: string;
}

export interface TiptapContent {
  type: 'doc';
  content?: TiptapNode[];
}

// Dashboard stats
export interface DashboardStats {
  totalPosts: number;
  totalDrafts: number;
  totalPublished: number;
  totalScheduled: number;
  totalCategories: number;
  totalTags: number;
  totalMedia: number;
  recentPosts: Post[];
}

// Toast
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}
