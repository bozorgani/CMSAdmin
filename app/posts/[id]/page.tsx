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
    if (res.ok && res.items) setCategories(res.items);
  }

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
              <label className="block text-sm font-medium mb-1">محتوا *</label>
              <RichTextEditor
                content={formData.content}
                onChange={(content) => setFormData(prev => ({ ...prev, content }))}
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
                  seo: { ...prev.seo, ogImageId: id || '' }
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
              onChange={(id) => setFormData(prev => ({ ...prev, coverImageId: id || '' }))}
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
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {categories
                .filter(cat => 
                  cat.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
                  cat.slug.toLowerCase().includes(categorySearch.toLowerCase())
                )
                .map((cat) => (
                  <label key={cat._id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.categoryIds.includes(cat._id)}
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
                      className="w-4 h-4"
                    />
                    <span className="text-sm flex-1">{cat.name}</span>
                    {formData.categoryIds.includes(cat._id) && (
                      <span className="text-xs text-blue-600">✓</span>
                    )}
                  </label>
                ))}
              {categories.filter(cat => 
                cat.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
                cat.slug.toLowerCase().includes(categorySearch.toLowerCase())
              ).length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">دسته‌بندی‌ای یافت نشد</p>
              )}
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
    </div>
  );
}
