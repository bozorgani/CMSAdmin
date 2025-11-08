'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getPost, createPost, updatePost } from '@/lib/api';
import { RichTextEditor } from '@/components/RichTextEditor';
import { MediaSelector } from '@/components/MediaSelector';
import { listCategories, listTags, createCategory, createTag } from '@/lib/api';
import DatePicker from 'react-multi-date-picker';
import TimePicker from 'react-multi-date-picker/plugins/time_picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';

export default function PostEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const isNew = id === 'new';
  
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [publishPickerValue, setPublishPickerValue] = useState<any>(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [tagSearch, setTagSearch] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [creatingTag, setCreatingTag] = useState(false);
  const [showHtmlImportModal, setShowHtmlImportModal] = useState(false);
  const [htmlImportText, setHtmlImportText] = useState('');
  const [htmlContentToImport, setHtmlContentToImport] = useState<string>('');
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: null as any,
    status: 'draft' as 'draft' | 'scheduled' | 'published',
    publishAt: '',
    categoryId: '',
    categoryIds: [] as string[],
    tags: [] as string[],
    keywords: [] as string[],
    coverImageId: '',
    canonicalUrl: '',
    isFeatured: false,
    seo: {
      metaTitle: '',
      metaDescription: '',
      robots: 'index, follow',
      ogTitle: '',
      ogDescription: '',
      ogImageId: '',
      twitterCard: 'summary_large_image',
      schemaType: 'Article'
    }
  });

  useEffect(() => {
    if (!isNew) {
      loadPost();
    }
    loadCategories();
    loadTags();
  }, [id]);

  async function loadPost() {
    if (!id) return;
    const res = await getPost(id);
    if (res.ok && res.post) {
      const post = res.post;
      setFormData({
        title: post.title || '',
        slug: post.slug || '',
        excerpt: post.excerpt || '',
        content: post.content || null,
        status: post.status || 'draft',
        publishAt: post.publishAt ? new Date(post.publishAt).toISOString().slice(0, 16) : '',
        categoryId: typeof post.categoryId === 'string' ? post.categoryId : (post.categoryId?._id?.toString() || ''),
        categoryIds: Array.isArray(post.categoryIds)
          ? post.categoryIds.map((c: any) => (typeof c === 'string' ? c : (c?._id?.toString() || ''))).filter(Boolean)
          : [],
        tags: Array.isArray(post.tags)
          ? post.tags.map((t: any) => (typeof t === 'string' ? t : (t?._id?.toString() || ''))).filter(Boolean)
          : [],
        keywords: Array.isArray(post.keywords) ? post.keywords : [],
        coverImageId: typeof post.coverImageId === 'string' ? post.coverImageId : (post.coverImageId?._id?.toString() || ''),
        canonicalUrl: post.canonicalUrl || '',
        isFeatured: post.isFeatured || false,
        seo: {
          metaTitle: post.seo?.metaTitle || '',
          metaDescription: post.seo?.metaDescription || '',
          robots: post.seo?.robots || 'index, follow',
          ogTitle: post.seo?.ogTitle || '',
          ogDescription: post.seo?.ogDescription || '',
          ogImageId: typeof post.seo?.ogImageId === 'string' ? post.seo.ogImageId : (post.seo?.ogImageId?._id?.toString() || ''),
          twitterCard: post.seo?.twitterCard || 'summary_large_image',
          schemaType: post.seo?.schemaType || 'Article'
        }
      });
      // Sync Persian picker with publishAt
      if (post.publishAt) {
        try {
          const d = new Date(post.publishAt);
          if (!isNaN(d.getTime())) setPublishPickerValue(d);
        } catch {}
      } else {
        setPublishPickerValue(null);
      }
    }
    setLoading(false);
  }

  async function loadCategories() {
    const res = await listCategories();
    if (res.ok && res.items) {
      setCategories(res.items);
    }
  }

  // Build hierarchical structure for categories
  const buildCategoryHierarchy = (cats: any[]) => {
    const categoryMap = new Map<string, any & { children?: any[] }>();
    const rootCategories: (any & { children?: any[] })[] = [];
    
    // First pass: create map
    cats.forEach(cat => {
      categoryMap.set(cat._id, { ...cat, children: [] });
    });
    
    // Second pass: build hierarchy
    cats.forEach(cat => {
      const category = categoryMap.get(cat._id)!;
      if (cat.parentId && (cat.parentId._id || typeof cat.parentId === 'string')) {
        const parentId = typeof cat.parentId === 'string' ? cat.parentId : cat.parentId._id;
        const parent = categoryMap.get(parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(category);
        } else {
          rootCategories.push(category);
        }
      } else {
        rootCategories.push(category);
      }
    });
    
    return rootCategories;
  };

  const hierarchicalCategories = buildCategoryHierarchy(categories);

  async function loadTags() {
    const res = await listTags();
    if (res.ok && res.items) setTags(res.items);
  }

  async function handleCreateCategory() {
    if (!newCategoryName.trim() || creatingCategory) return;
    setCreatingCategory(true);
    try {
      const res = await createCategory({ name: newCategoryName.trim() });
      if (res.ok && res.category) {
        setCategories(prev => [...prev, res.category]);
        setFormData(prev => ({
          ...prev,
          categoryIds: [...prev.categoryIds, res.category._id]
        }));
        setNewCategoryName('');
        setCategorySearch('');
      } else {
        alert(res.error || 'خطا در ایجاد دسته‌بندی');
      }
    } catch (e) {
      alert('خطا در ایجاد دسته‌بندی');
    } finally {
      setCreatingCategory(false);
    }
  }

  async function handleCreateTag() {
    if (!newTagName.trim() || creatingTag) return;
    setCreatingTag(true);
    try {
      const res = await createTag({ name: newTagName.trim() });
      if (res.ok && res.tag) {
        setTags(prev => [...prev, res.tag]);
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, res.tag._id]
        }));
        setNewTagName('');
        setTagSearch('');
      } else {
        alert(res.error || 'خطا در ایجاد برچسب');
      }
    } catch (e) {
      alert('خطا در ایجاد برچسب');
    } finally {
      setCreatingTag(false);
    }
  }

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function handleTitleChange(title: string) {
    setFormData(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
      seo: {
        ...prev.seo,
        metaTitle: prev.seo.metaTitle || title,
        ogTitle: prev.seo.ogTitle || title
      }
    }));
  }

  // Extract plain text from TipTap JSON content
  function extractTextFromContent(content: any): string {
    if (!content) return '';
    if (typeof content === 'string') return content;
    if (!content.content || !Array.isArray(content.content)) return '';
    
    let text = '';
    function traverse(node: any) {
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

  // Calculate keyword density
  function calculateKeywordDensity(keywords: string[], content: any, title: string = '', excerpt: string = ''): Array<{ keyword: string; count: number; density: number }> {
    if (!keywords || keywords.length === 0) return [];
    
    // Combine title, excerpt, and content for analysis
    const contentText = extractTextFromContent(content);
    const fullText = [title, excerpt, contentText].filter(Boolean).join(' ');
    
    if (!fullText) return [];
    
    // Normalize text: lowercase, remove punctuation, split into words
    // Support Persian, Arabic, and English characters
    const normalizedText = fullText.toLowerCase().replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFa-z0-9\s]/g, ' ');
    const words = normalizedText.split(/\s+/).filter(w => w.length > 0);
    const totalWords = words.length;
    
    if (totalWords === 0) return [];
    
    return keywords.map(keyword => {
      const normalizedKeyword = keyword.toLowerCase().trim();
      if (!normalizedKeyword) return { keyword, count: 0, density: 0 };
      
      // Count occurrences (including partial matches for multi-word keywords)
      const keywordWords = normalizedKeyword.split(/\s+/);
      let count = 0;
      
      if (keywordWords.length === 1) {
        // Single word: exact match
        count = words.filter(w => w === normalizedKeyword).length;
      } else {
        // Multi-word: count phrase occurrences
        const phrase = normalizedKeyword;
        let index = 0;
        const joinedText = normalizedText;
        while ((index = joinedText.indexOf(phrase, index)) !== -1) {
          count++;
          index += phrase.length;
        }
      }
      
      const density = totalWords > 0 ? (count / totalWords) * 100 : 0;
      return { keyword, count, density: Math.round(density * 100) / 100 };
    });
  }

  const keywordDensity = calculateKeywordDensity(formData.keywords, formData.content, formData.title, formData.excerpt);

  // Parse full HTML document and extract all information
  function parseFullHtml(html: string) {
    try {
      // Create a temporary DOM parser
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const result: any = {
        title: '',
        metaDescription: '',
        keywords: [] as string[],
        canonicalUrl: '',
        ogTitle: '',
        ogDescription: '',
        ogImage: '',
        ogType: '',
        ogLocale: '',
        content: '',
        excerpt: ''
      };

      // Extract title from <title> tag
      const titleTag = doc.querySelector('title');
      if (titleTag) {
        result.title = titleTag.textContent?.trim() || '';
      }

      // Extract meta description
      const metaDescription = doc.querySelector('meta[name="description"]');
      if (metaDescription) {
        result.metaDescription = metaDescription.getAttribute('content') || '';
      }

      // Extract keywords
      const metaKeywords = doc.querySelector('meta[name="keywords"]');
      if (metaKeywords) {
        const keywordsContent = metaKeywords.getAttribute('content') || '';
        result.keywords = keywordsContent
          .split(',')
          .map(k => k.trim())
          .filter(k => k.length > 0);
      }

      // Extract canonical URL
      const canonical = doc.querySelector('link[rel="canonical"]');
      if (canonical) {
        result.canonicalUrl = canonical.getAttribute('href') || '';
      }

      // Extract Open Graph tags
      const ogTitle = doc.querySelector('meta[property="og:title"]');
      if (ogTitle) {
        result.ogTitle = ogTitle.getAttribute('content') || '';
      }

      const ogDescription = doc.querySelector('meta[property="og:description"]');
      if (ogDescription) {
        result.ogDescription = ogDescription.getAttribute('content') || '';
      }

      const ogImage = doc.querySelector('meta[property="og:image"]');
      if (ogImage) {
        result.ogImage = ogImage.getAttribute('content') || '';
      }

      const ogType = doc.querySelector('meta[property="og:type"]');
      if (ogType) {
        result.ogType = ogType.getAttribute('content') || '';
      }

      const ogUrl = doc.querySelector('meta[property="og:url"]');
      if (ogUrl) {
        // Use og:url for canonical if canonical is not set
        if (!result.canonicalUrl) {
          result.canonicalUrl = ogUrl.getAttribute('content') || '';
        }
      }

      const ogLocale = doc.querySelector('meta[property="og:locale"]');
      if (ogLocale) {
        result.ogLocale = ogLocale.getAttribute('content') || '';
      }

      // Extract content from body
      // Try to find <article> first, then <main>, then <body>
      let contentElement = doc.querySelector('article');
      if (!contentElement) {
        contentElement = doc.querySelector('main');
      }
      if (!contentElement) {
        contentElement = doc.querySelector('body');
      }
      
      if (contentElement) {
        // Clone the element to avoid modifying the original
        const clonedElement = contentElement.cloneNode(true) as Element;
        
        // Remove header, footer, nav, and script/style tags
        const elementsToRemove = clonedElement.querySelectorAll('header, footer, nav, script, style, noscript');
        elementsToRemove.forEach(el => el.remove());
        
        // Extract excerpt from first paragraph (before removing anything)
        const firstP = clonedElement.querySelector('p');
        if (firstP) {
          result.excerpt = firstP.textContent?.trim().substring(0, 200) || '';
        }
        
        // Extract H1 for title if title is empty
        if (!result.title) {
          const h1 = clonedElement.querySelector('h1');
          if (h1) {
            result.title = h1.textContent?.trim() || '';
            // Optionally remove H1 from content if it's the same as title
            // (to avoid duplication)
          }
        }
        
        // Remove style attribute from the main container element only
        // (keep styles in child elements as they might be part of content)
        clonedElement.removeAttribute('style');
        clonedElement.removeAttribute('dir');
        clonedElement.removeAttribute('lang');
        
        // Get innerHTML of cleaned content
        result.content = clonedElement.innerHTML.trim();
        
        // Clean up empty paragraphs and extra whitespace
        result.content = result.content
          .replace(/<p>\s*<\/p>/g, '')
          .replace(/\n\s*\n/g, '\n')
          .trim();
        
        // If content is still empty, try to get text content as fallback
        if (!result.content && clonedElement.textContent) {
          // Convert text to paragraphs
          const paragraphs = clonedElement.textContent
            .split(/\n\s*\n/)
            .filter(p => p.trim().length > 0)
            .map(p => `<p>${p.trim()}</p>`)
            .join('\n');
          result.content = paragraphs;
        }
      }

      return result;
    } catch (error) {
      console.error('Error parsing HTML:', error);
      throw new Error('خطا در parsing HTML: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  // Handle HTML import
  function handleImportHtml() {
    if (!htmlImportText.trim()) {
      alert('لطفا HTML را وارد کنید');
      return;
    }

    try {
      const parsed = parseFullHtml(htmlImportText);
      
      // Map og:type to schemaType
      const getSchemaType = (ogType: string, currentSchemaType: string): string => {
        if (!ogType) return currentSchemaType;
        // Map common og:type values to schema types
        const typeMap: Record<string, string> = {
          'article': 'Article',
          'Article': 'Article',
          'blog': 'BlogPosting',
          'BlogPosting': 'BlogPosting',
          'news': 'NewsArticle',
          'NewsArticle': 'NewsArticle',
        };
        return typeMap[ogType] || ogType || currentSchemaType;
      };

      // Update form data
      setFormData(prev => {
        const schemaType = getSchemaType(parsed.ogType, prev.seo.schemaType);
        
        return {
          ...prev,
          title: parsed.title || prev.title,
          slug: prev.slug || generateSlug(parsed.title || prev.title),
          excerpt: parsed.excerpt || prev.excerpt,
          keywords: parsed.keywords.length > 0 ? parsed.keywords : prev.keywords,
          canonicalUrl: parsed.canonicalUrl || prev.canonicalUrl,
          seo: {
            ...prev.seo,
            metaTitle: parsed.title || prev.seo.metaTitle,
            metaDescription: parsed.metaDescription || prev.seo.metaDescription,
            ogTitle: parsed.ogTitle || parsed.title || prev.seo.ogTitle,
            ogDescription: parsed.ogDescription || parsed.metaDescription || prev.seo.ogDescription,
            schemaType: schemaType,
          }
        };
      });

      // Set HTML content to import in editor
      if (parsed.content) {
        // Clean up HTML content - remove script and style tags for safety
        let cleanedContent = parsed.content
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
        
        // Set HTML content to trigger import in RichTextEditor
        setHtmlContentToImport(cleanedContent);
        
        // Close modal and clear input
        setHtmlImportText('');
        setShowHtmlImportModal(false);
        
        // Show success message with all extracted information
        setTimeout(() => {
          const ogInfo = [];
          if (parsed.ogTitle) ogInfo.push(`OG Title: ${parsed.ogTitle.substring(0, 50)}`);
          if (parsed.ogDescription) ogInfo.push(`OG Description: ${parsed.ogDescription.substring(0, 50)}`);
          if (parsed.ogImage) ogInfo.push(`OG Image: ${parsed.ogImage}`);
          if (parsed.ogType) ogInfo.push(`OG Type: ${parsed.ogType}`);
          if (parsed.ogLocale) ogInfo.push(`OG Locale: ${parsed.ogLocale}`);
          
          const message = `✅ HTML با موفقیت import شد!\n\n📋 اطلاعات استخراج شده:\n- عنوان: ${parsed.title || 'خالی'}\n- توضیحات: ${parsed.metaDescription?.substring(0, 50) || 'خالی'}...\n- کلمات کلیدی: ${parsed.keywords.length} عدد\n- Canonical URL: ${parsed.canonicalUrl || 'خالی'}\n${ogInfo.length > 0 ? '\n📱 Open Graph:\n' + ogInfo.map(info => '- ' + info).join('\n') : ''}\n\n✨ محتوا به ویرایشگر اضافه شد.${parsed.ogImage ? '\n\n⚠️ توجه: لطفا تصویر OG را از Media Library انتخاب کنید.' : ''}`;
          alert(message);
        }, 100);
      } else {
        setShowHtmlImportModal(false);
        alert('⚠️ محتوایی در HTML یافت نشد!');
      }
    } catch (error) {
      alert('خطا در import HTML: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        ...formData,
        publishAt: formData.publishAt ? new Date(formData.publishAt).toISOString() : undefined,
        categoryId: formData.categoryId || undefined,
        categoryIds: formData.categoryIds.length > 0 ? formData.categoryIds : undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        keywords: formData.keywords.length > 0 ? formData.keywords : undefined,
        coverImageId: formData.coverImageId || undefined,
        seo: {
          ...formData.seo,
          ogImageId: formData.seo.ogImageId || undefined
        }
      };
      
      const res = isNew 
        ? await createPost(payload)
        : await updatePost(id, payload);
      
      if (res.ok) {
        router.push('/posts');
      } else {
        alert(res.error || 'خطا در ذخیره');
      }
    } catch (e) {
      alert('خطا در ذخیره');
    } finally {
      setSaving(false);
    }
  }

  // no-op

  if (loading) {
    return <div className="p-6">در حال بارگذاری...</div>;
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">{isNew ? 'ایجاد پست جدید' : 'ویرایش پست'}</h1>
          <p className="text-gray-600 mt-1 text-sm lg:text-base">{isNew ? 'پست جدید خود را ایجاد کنید' : 'ویرایش و به‌روزرسانی پست'}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => router.push('/posts')}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-all text-sm lg:text-base whitespace-nowrap"
          >
            انصراف
          </button>
          {!isNew && (
            <button
              onClick={() => router.push(`/posts/${id}/preview`)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-sm hover:shadow-md text-sm lg:text-base whitespace-nowrap"
            >
              👁️ پیش‌نمایش
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm hover:shadow-md text-sm lg:text-base whitespace-nowrap"
          >
            {saving ? 'در حال ذخیره...' : 'ذخیره'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* فرم اصلی */}
        <div className="lg:col-span-2 space-y-4 lg:space-y-6">
          {/* اطلاعات پایه */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6 space-y-4">
            <h2 className="text-lg font-semibold">اطلاعات پایه</h2>
            
            <div>
              <label className="block text-sm font-medium mb-1">عنوان *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="عنوان پست"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">اسلاگ (URL) *</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="slug-url"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">خلاصه (Excerpt)</label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md"
                rows={3}
                placeholder="خلاصه کوتاه پست"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium">محتوا *</label>
                <button
                  type="button"
                  onClick={() => setShowHtmlImportModal(true)}
                  className="px-3 py-1 text-xs bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                  title="Import HTML کامل (با head و body)"
                >
                  📥 Import HTML کامل
                </button>
              </div>
              <RichTextEditor
                content={formData.content}
                onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                htmlContent={htmlContentToImport}
                onHtmlImported={() => setHtmlContentToImport('')}
              />
            </div>
          </div>

          {/* SEO Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6 space-y-4">
            <h2 className="text-lg font-semibold">تنظیمات SEO</h2>
            
            <div>
              <label className="block text-sm font-medium mb-1">Meta Title</label>
              <input
                type="text"
                value={formData.seo.metaTitle}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  seo: { ...prev.seo, metaTitle: e.target.value }
                }))}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="عنوان برای SEO (50-60 کاراکتر)"
              />
              <p className="text-xs text-gray-500 mt-1">{formData.seo.metaTitle.length} کاراکتر</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Meta Description</label>
              <textarea
                value={formData.seo.metaDescription}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  seo: { ...prev.seo, metaDescription: e.target.value }
                }))}
                className="w-full px-3 py-2 border rounded-md"
                rows={3}
                placeholder="توضیحات برای SEO (150-160 کاراکتر)"
              />
              <p className="text-xs text-gray-500 mt-1">{formData.seo.metaDescription.length} کاراکتر</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Robots</label>
              <select
                value={formData.seo.robots}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  seo: { ...prev.seo, robots: e.target.value }
                }))}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="index, follow">index, follow</option>
                <option value="noindex, follow">noindex, follow</option>
                <option value="index, nofollow">index, nofollow</option>
                <option value="noindex, nofollow">noindex, nofollow</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Open Graph Title</label>
              <input
                type="text"
                value={formData.seo.ogTitle}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  seo: { ...prev.seo, ogTitle: e.target.value }
                }))}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Open Graph Description</label>
              <textarea
                value={formData.seo.ogDescription}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  seo: { ...prev.seo, ogDescription: e.target.value }
                }))}
                className="w-full px-3 py-2 border rounded-md"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Open Graph Image</label>
              <MediaSelector
                value={formData.seo.ogImageId}
                onChange={(id) => setFormData(prev => ({
                  ...prev,
                  seo: { ...prev.seo, ogImageId: id ?? '' }
                }))}
                label=""
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Twitter Card</label>
              <select
                value={formData.seo.twitterCard}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  seo: { ...prev.seo, twitterCard: e.target.value }
                }))}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="summary">summary</option>
                <option value="summary_large_image">summary_large_image</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Schema Type</label>
              <select
                value={formData.seo.schemaType}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  seo: { ...prev.seo, schemaType: e.target.value }
                }))}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="Article">Article</option>
                <option value="BlogPosting">BlogPosting</option>
                <option value="NewsArticle">NewsArticle</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Canonical URL</label>
              <input
                type="url"
                value={formData.canonicalUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, canonicalUrl: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="https://example.com/post"
              />
            </div>
          </div>

          {/* کلمات کلیدی */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6 space-y-4">
            <h2 className="text-lg font-semibold">کلمات کلیدی</h2>
            
            <div>
              <label className="block text-sm font-medium mb-1">کلمات کلیدی (جدا شده با کاما)</label>
              <textarea
                value={formData.keywords.join(', ')}
                onChange={(e) => {
                  const keywords = e.target.value
                    .split(',')
                    .map(k => k.trim())
                    .filter(k => k.length > 0);
                  setFormData(prev => ({ ...prev, keywords }));
                }}
                className="w-full px-3 py-2 border rounded-md"
                rows={3}
                placeholder="کلمه کلیدی ۱, کلمه کلیدی ۲, کلمه کلیدی ۳"
              />
              <p className="text-xs text-gray-500 mt-1">
                کلمات کلیدی را با کاما از هم جدا کنید
              </p>
            </div>

            {/* نمایش چگالی کلمات کلیدی */}
            {keywordDensity.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h3 className="text-sm font-medium mb-3">تحلیل چگالی کلمات کلیدی</h3>
                <div className="space-y-3">
                  {keywordDensity.map((item, idx) => {
                    const densityPercent = Math.min(item.density, 5); // Cap at 5% for visualization
                    const isOptimal = item.density >= 1 && item.density <= 3;
                    const isHigh = item.density > 3;
                    const isLow = item.density < 1;
                    
                    return (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1">
                            <span className="text-sm font-semibold text-gray-900">{item.keyword}</span>
                            <span className="text-xs text-gray-500 mr-2">({item.count} بار در محتوا)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold ${
                              isOptimal ? 'text-green-600' :
                              isHigh ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {item.density.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              isOptimal ? 'bg-green-500' :
                              isHigh ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${(densityPercent / 5) * 100}%` }}
                          />
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          {isOptimal && (
                            <span className="text-green-600 flex items-center gap-1">
                              <span>✓</span>
                              <span>چگالی مناسب</span>
                            </span>
                          )}
                          {isHigh && (
                            <span className="text-yellow-600 flex items-center gap-1">
                              <span>⚠</span>
                              <span>چگالی بالا - ممکن است اسپم تلقی شود</span>
                            </span>
                          )}
                          {isLow && (
                            <span className="text-red-600 flex items-center gap-1">
                              <span>!</span>
                              <span>چگالی پایین - باید بیشتر استفاده شود</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-800">
                    <strong>راهنمای چگالی:</strong> چگالی مناسب بین 1-3% است. کمتر از 1% ممکن است برای SEO کافی نباشد و بیشتر از 3% ممکن است به عنوان اسپم تلقی شود.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* سایدبار */}
        <div className="space-y-4 lg:space-y-6">
          {/* انتشار */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6 space-y-4">
            <h2 className="text-lg font-semibold">انتشار</h2>
            
            <div>
              <label className="block text-sm font-medium mb-1">وضعیت</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="draft">پیش‌نویس</option>
                <option value="scheduled">زمان‌بندی شده</option>
                <option value="published">منتشر شده</option>
              </select>
            </div>

            {(formData.status === 'scheduled' || formData.status === 'published') && (
              <div>
                <label className="block text-sm font-medium mb-1">تاریخ انتشار</label>
              <DatePicker
                value={publishPickerValue}
                onChange={(val: any) => {
                  setPublishPickerValue(val || null);
                  if (!val) {
                    setFormData(prev => ({ ...prev, publishAt: '' }));
                    return;
                  }
                  const v = Array.isArray(val) ? val[0] : val;
                  try {
                    // v.toDate() returns Gregorian JS Date
                    const jsDate = typeof v?.toDate === 'function' ? v.toDate() : new Date(v);
                    if (jsDate && !isNaN(jsDate.getTime())) {
                      setFormData(prev => ({ ...prev, publishAt: jsDate.toISOString() }));
                    }
                  } catch {}
                }}
                calendar={persian}
                locale={persian_fa}
                format="YYYY/MM/DD HH:mm"
                plugins={[<TimePicker position="bottom" />]}
                className="w-full"
                style={{ width: '100%' }}
              />
              </div>
            )}

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                className="w-4 h-4"
              />
              <span className="text-sm">پست ویژه</span>
            </label>
          </div>

          {/* تصویر شاخص */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6 space-y-4">
            <h2 className="text-lg font-semibold">تصویر شاخص</h2>
            <MediaSelector
              value={formData.coverImageId}
              onChange={(id) => setFormData(prev => ({ ...prev, coverImageId: id ?? '' }))}
              label=""
            />
          </div>

          {/* دسته‌بندی */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">دسته‌بندی‌ها</h2>
              <span className="text-xs text-gray-500">
                {formData.categoryIds.length} انتخاب شده
              </span>
            </div>
            
            {/* جستجو */}
            <div>
              <input
                type="text"
                placeholder="جستجو در دسته‌بندی‌ها..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>

            {/* ایجاد دسته‌بندی جدید */}
            <div className="border-t pt-3">
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="نام دسته‌بندی جدید..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newCategoryName.trim()) {
                      handleCreateCategory();
                    }
                  }}
                  className="flex-1 px-3 py-1.5 border rounded-md text-sm"
                />
                <button
                  onClick={handleCreateCategory}
                  disabled={!newCategoryName.trim() || creatingCategory}
                  className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm whitespace-nowrap"
                >
                  {creatingCategory ? '...' : '+ افزودن'}
                </button>
              </div>
            </div>

            {/* لیست دسته‌بندی‌ها */}
            <div className="space-y-1 max-h-64 overflow-y-auto border rounded-lg p-2">
              {(() => {
                // Filter categories based on search
                const filtered = categorySearch
                  ? hierarchicalCategories.filter(cat => {
                      const matchesMain = cat.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
                                        cat.slug.toLowerCase().includes(categorySearch.toLowerCase());
                      const matchesChildren = cat.children?.some((child: any) => 
                        child.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
                        child.slug.toLowerCase().includes(categorySearch.toLowerCase())
                      );
                      return matchesMain || matchesChildren;
                    })
                  : hierarchicalCategories;

                if (filtered.length === 0) {
                  return (
                    <p className="text-sm text-gray-500 text-center py-4">دسته‌بندی‌ای یافت نشد</p>
                  );
                }

                const renderCategory = (cat: any, level = 0): JSX.Element | null => {
                  const isMainCategory = !cat.parentId || (typeof cat.parentId === 'object' && !cat.parentId._id);
                  const isSelected = formData.categoryIds.includes(cat._id);
                  const hasSelectedChild = cat.children?.some((child: any) => formData.categoryIds.includes(child._id));

                  return (
                    <div key={cat._id} className="space-y-1">
                      <label 
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                          isMainCategory 
                            ? 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800' 
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        } ${isSelected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
                        style={{ marginRight: level > 0 ? `${level * 1.5}rem` : '0' }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                categoryIds: [...prev.categoryIds, cat._id]
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                categoryIds: prev.categoryIds.filter(c => c !== cat._id)
                              }));
                            }
                          }}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div className="flex items-center gap-2 flex-1">
                          {level > 0 && (
                            <span className="text-gray-400 text-xs">└─</span>
                          )}
                          {isMainCategory && (
                            <span className="text-blue-600 text-sm">📂</span>
                          )}
                          {!isMainCategory && (
                            <span className="text-gray-500 text-xs">•</span>
                          )}
                          <span className={`text-sm flex-1 ${isMainCategory ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
                            {cat.name}
                          </span>
                          {isMainCategory && cat.children && cat.children.length > 0 && (
                            <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                              {cat.children.length} زیردسته
                            </span>
                          )}
                        </div>
                        {isSelected && (
                          <span className="text-blue-600 text-sm font-bold">✓</span>
                        )}
                        {hasSelectedChild && !isSelected && (
                          <span className="text-blue-400 text-xs">○</span>
                        )}
                      </label>
                      {/* Render children */}
                      {cat.children && cat.children.length > 0 && (
                        <div className="space-y-1">
                          {cat.children
                            .filter((child: any) => {
                              if (!categorySearch) return true;
                              return child.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
                                     child.slug.toLowerCase().includes(categorySearch.toLowerCase());
                            })
                            .map((child: any) => renderCategory(child, level + 1))
                            .filter(Boolean)}
                        </div>
                      )}
                    </div>
                  );
                };

                return filtered.map(cat => renderCategory(cat)).filter(Boolean);
              })()}
            </div>
          </div>

          {/* برچسب‌ها */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">برچسب‌ها</h2>
              <span className="text-xs text-gray-500">
                {formData.tags.length} انتخاب شده
              </span>
            </div>

            {/* جستجو */}
            <div>
              <input
                type="text"
                placeholder="جستجو در برچسب‌ها..."
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>

            {/* ایجاد برچسب جدید */}
            <div className="border-t pt-3">
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="نام برچسب جدید..."
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newTagName.trim()) {
                      handleCreateTag();
                    }
                  }}
                  className="flex-1 px-3 py-1.5 border rounded-md text-sm"
                />
                <button
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim() || creatingTag}
                  className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm whitespace-nowrap"
                >
                  {creatingTag ? '...' : '+ افزودن'}
                </button>
              </div>
            </div>

            {/* لیست برچسب‌ها */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {tags
                .filter(tag => 
                  tag.name.toLowerCase().includes(tagSearch.toLowerCase()) ||
                  tag.slug.toLowerCase().includes(tagSearch.toLowerCase())
                )
                .map((tag) => (
                  <label key={tag._id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.tags.includes(tag._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            tags: [...prev.tags, tag._id]
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            tags: prev.tags.filter(t => t !== tag._id)
                          }));
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm flex-1">{tag.name}</span>
                    {formData.tags.includes(tag._id) && (
                      <span className="text-xs text-blue-600">✓</span>
                    )}
                  </label>
                ))}
              {tags.filter(tag => 
                tag.name.toLowerCase().includes(tagSearch.toLowerCase()) ||
                tag.slug.toLowerCase().includes(tagSearch.toLowerCase())
              ).length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">برچسبی یافت نشد</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* HTML Import Modal */}
      {showHtmlImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Import HTML کامل</h3>
                <p className="text-sm text-gray-600 mt-1">
                  HTML کامل صفحه (با DOCTYPE، head، body) را paste کنید. اطلاعات به‌طور خودکار استخراج می‌شود.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowHtmlImportModal(false);
                  setHtmlImportText('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <textarea
                value={htmlImportText}
                onChange={(e) => setHtmlImportText(e.target.value)}
                className="w-full min-h-[400px] p-4 border-2 border-gray-300 rounded-md font-mono text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-50"
                placeholder="<!DOCTYPE html>&#10;<html>&#10;  <head>&#10;    <title>عنوان</title>&#10;    <meta name=&quot;description&quot; content=&quot;...&quot; />&#10;  </head>&#10;  <body>&#10;    <article>&#10;      <h1>عنوان</h1>&#10;      <p>محتوا...</p>&#10;    </article>&#10;  </body>&#10;</html>"
                dir="ltr"
                spellCheck={false}
                style={{ 
                  fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, monospace',
                  lineHeight: '1.5'
                }}
              />
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-xs text-blue-800 mb-2">
                  <strong>💡 اطلاعاتی که استخراج می‌شود:</strong>
                </p>
                <ul className="text-xs text-blue-700 list-disc list-inside space-y-1">
                  <li>عنوان از &lt;title&gt; یا &lt;h1&gt;</li>
                  <li>Meta Description</li>
                  <li>Keywords</li>
                  <li>Canonical URL (از &lt;link rel="canonical"&gt; یا og:url)</li>
                  <li>Open Graph Tags:
                    <ul className="list-disc list-inside mr-4 mt-1 space-y-0.5">
                      <li>og:title</li>
                      <li>og:description</li>
                      <li>og:image</li>
                      <li>og:type (تبدیل به Schema Type)</li>
                      <li>og:url (استفاده برای Canonical)</li>
                      <li>og:locale</li>
                    </ul>
                  </li>
                  <li>محتوا از &lt;article&gt;، &lt;main&gt; یا &lt;body&gt;</li>
                </ul>
              </div>
            </div>
            
            <div className="p-4 border-t flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowHtmlImportModal(false);
                  setHtmlImportText('');
                }}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleImportHtml}
                disabled={!htmlImportText.trim()}
                className="px-4 py-2 text-sm text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ✓ Import و استخراج اطلاعات
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
