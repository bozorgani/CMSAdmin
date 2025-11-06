'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getPost, getMediaUrl, getMedia } from '@/lib/api';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import dayjs from 'dayjs';
import 'dayjs/locale/fa';

dayjs.locale('fa');

// This page should render without Layout
export const dynamic = 'force-dynamic';

export default function PostPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [ogImageUrl, setOgImageUrl] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800',
        },
      }),
    ],
    editable: false,
    content: null,
  });

  useEffect(() => {
    if (id && id !== 'new') {
      loadPost();
    }
  }, [id]);

  async function loadPost() {
    setLoading(true);
    const res = await getPost(id);
    if (res.ok && res.post) {
      const postData = res.post;
      setPost(postData);
      
      // Normalize image URLs inside editor content (tiptap JSON)
      function rewriteImageSrc(node: any): any {
        if (!node) return node;
        const cloned = { ...node };
        if (cloned.type === 'image' && cloned.attrs?.src) {
          cloned.attrs = { ...cloned.attrs, src: getMediaUrl(String(cloned.attrs.src)) };
        }
        if (Array.isArray(cloned.content)) {
          cloned.content = cloned.content.map(rewriteImageSrc);
        }
        return cloned;
      }
      
      // Load cover image - check if it's already populated or needs fetching
      if (postData.coverImageId) {
        if (typeof postData.coverImageId === 'object' && postData.coverImageId.path) {
          // Already populated from API
          setCoverImageUrl(getMediaUrl(postData.coverImageId.path));
        } else {
          // Need to fetch
          try {
            const mediaRes = await getMedia(postData.coverImageId.toString());
            if (mediaRes.ok && mediaRes.media) {
              setCoverImageUrl(getMediaUrl(mediaRes.media.path));
            }
          } catch (e) {
            // Error loading cover image
          }
        }
      }

      // Load OG image - check if it's already populated or needs fetching
      if (postData.seo?.ogImageId) {
        if (typeof postData.seo.ogImageId === 'object' && postData.seo.ogImageId.path) {
          // Already populated from API
          setOgImageUrl(getMediaUrl(postData.seo.ogImageId.path));
        } else {
          // Need to fetch
          try {
            const mediaRes = await getMedia(postData.seo.ogImageId.toString());
            if (mediaRes.ok && mediaRes.media) {
              setOgImageUrl(getMediaUrl(mediaRes.media.path));
            }
          } catch (e) {
            // Error loading OG image
          }
        }
      }

      // Set editor content
      if (editor && postData.content) {
        const contentWithAbsoluteImages = rewriteImageSrc(postData.content);
        editor.commands.setContent(contentWithAbsoluteImages);
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    if (editor && post?.content) {
      // Ensure images inside content have absolute API URLs
      function rewriteImageSrc(node: any): any {
        if (!node) return node;
        const cloned = { ...node };
        if (cloned.type === 'image' && cloned.attrs?.src) {
          cloned.attrs = { ...cloned.attrs, src: getMediaUrl(String(cloned.attrs.src)) };
        }
        if (Array.isArray(cloned.content)) {
          cloned.content = cloned.content.map(rewriteImageSrc);
        }
        return cloned;
      }
      editor.commands.setContent(rewriteImageSrc(post.content));
    }
  }, [editor, post]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">پست یافت نشد</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            بازگشت
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Preview Banner */}
      <div className="bg-yellow-50 border-b border-yellow-200 py-3 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-yellow-800 font-medium">👁️ پیش‌نمایش پست</span>
            <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs font-medium">
              {post.status === 'draft' ? 'پیش‌نویس' : post.status === 'scheduled' ? 'زمان‌بندی شده' : 'منتشر شده'}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/posts/${id}`)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              ویرایش
            </button>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              بازگشت
            </button>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="text-xl text-gray-600 mb-6 leading-relaxed">
              {post.excerpt}
            </p>
          )}

          {/* Meta Info */}
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
            {post.publishAt && (
              <span>
                📅 {dayjs(post.publishAt).format('DD MMMM YYYY')}
              </span>
            )}
            {post.readingTime && (
              <span>
                ⏱️ {post.readingTime} دقیقه خواندن
              </span>
            )}
          </div>

          {/* Cover Image */}
          {coverImageUrl && (
            <div className="mb-8 rounded-xl overflow-hidden shadow-lg">
              <img
                src={coverImageUrl}
                alt={post.title}
                className="w-full h-auto object-cover"
              />
            </div>
          )}
        </header>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          {editor && <EditorContent editor={editor} />}
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-200">
          {post.tags && post.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">برچسب‌ها:</h3>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag: any, index: number) => {
                  const tagName = typeof tag === 'string' 
                    ? tag 
                    : (tag?.name || tag?.slug || tag?._id || tag || 'برچسب');
                  return (
                    <span
                      key={tag?._id || index}
                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                    >
                      #{tagName}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
          
          {post.categoryId && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">دسته‌بندی:</h3>
              <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm">
                {typeof post.categoryId === 'string' 
                  ? 'در حال بارگذاری...' 
                  : (post.categoryId?.name || post.categoryId?.slug || 'دسته‌بندی')}
              </span>
            </div>
          )}
        </footer>
      </article>

      {/* SEO Preview Info */}
      <div className="max-w-4xl mx-auto px-6 pb-12">
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">پیش‌نمایش SEO</h3>
          
          {/* Google Search Preview */}
          <div className="mb-6">
            <p className="text-xs text-gray-500 mb-2">نمایش در Google:</p>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-blue-600 text-sm mb-1">
                {post.slug || 'example.com'}
              </div>
              <div className="text-xl text-blue-700 font-medium mb-1">
                {post.seo?.metaTitle || post.title}
              </div>
              <div className="text-sm text-gray-600">
                {post.seo?.metaDescription || post.excerpt || 'توضیحات پست...'}
              </div>
            </div>
          </div>

          {/* Open Graph Preview */}
          {post.seo?.ogTitle && (
            <div className="mb-6">
              <p className="text-xs text-gray-500 mb-2">نمایش در شبکه‌های اجتماعی:</p>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden max-w-md">
                {ogImageUrl && (
                  <img src={ogImageUrl} alt={post.seo.ogTitle} className="w-full h-48 object-cover" />
                )}
                <div className="p-4">
                  <div className="text-xs text-gray-500 uppercase mb-1">example.com</div>
                  <div className="text-base font-semibold text-gray-900 mb-1">
                    {post.seo.ogTitle}
                  </div>
                  <div className="text-sm text-gray-600">
                    {post.seo.ogDescription || post.excerpt}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

