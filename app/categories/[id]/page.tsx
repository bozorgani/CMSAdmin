'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCategory, createCategory, updateCategory, listCategories } from '@/lib/api';

export default function CategoryEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const isNew = id === 'new';
  
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    parentId: '',
    seo: {
      metaTitle: '',
      metaDescription: ''
    }
  });

  useEffect(() => {
    async function loadAllCategories() {
      const res = await listCategories();
      if (res.ok && res.items) {
        // Filter out current category if editing to prevent circular reference
        const filtered = isNew 
          ? res.items 
          : res.items.filter((cat: any) => cat._id !== id);
        setAllCategories(filtered);
      }
    }
    loadAllCategories();
  }, [id, isNew]);

  useEffect(() => {
    if (!isNew && id) {
      loadCategory();
    } else if (isNew) {
      setLoading(false);
    }
  }, [id, isNew]);

  async function loadCategory() {
    if (!id) return;
    const res = await getCategory(id);
    if (res.ok && res.category) {
      const cat = res.category;
      setFormData({
        name: cat.name || '',
        slug: cat.slug || '',
        description: cat.description || '',
        parentId: cat.parentId?._id || cat.parentId || '',
        seo: {
          metaTitle: cat.seo?.metaTitle || '',
          metaDescription: cat.seo?.metaDescription || ''
        }
      });
    }
    setLoading(false);
  }

  function generateSlug(name: string) {
    // Map Persian category names to English slugs
    const categorySlugMap: Record<string, string> = {
      // Main categories
      'توسعه فرانت‌اند': 'frontend',
      'Frontend Development': 'frontend',
      'بک‌اند و سرور': 'backend',
      'Backend & APIs': 'backend',
      'سئو و بهینه‌سازی': 'seo',
      'SEO & Performance': 'seo',
      'هوش مصنوعی و ابزارهای نوین': 'ai-tools',
      'AI & Tools': 'ai-tools',
      'توسعه وب مدرن': 'modern-web',
      'Modern Web Development': 'modern-web',
      // Subcategories - Frontend
      'Next.js': 'nextjs',
      'React': 'react',
      'TypeScript': 'typescript',
      'Tailwind CSS': 'tailwind',
      'UI/UX': 'ui-ux',
      // Subcategories - Backend
      'Node.js': 'nodejs',
      'Express': 'express',
      'API Design': 'api-design',
      'Database': 'database',
      // Subcategories - SEO
      'سئو تکنیکال': 'technical-seo',
      'Technical SEO': 'technical-seo',
      'Performance Optimization': 'performance',
      'Content SEO': 'content-seo',
      'Google Search Console': 'search-console',
      // Subcategories - AI
      'AI Tools': 'ai-tools',
      'GitHub Copilot': 'github-copilot',
      'ChatGPT for Developers': 'chatgpt',
      'Automation': 'automation',
      // Subcategories - Modern Web
      'Trends 2025': 'trends-2025',
      'Edge Runtime': 'edge-runtime',
      'Serverless': 'serverless',
      'Web Frameworks': 'web-frameworks',
    };
    
    // Check if we have a direct mapping
    if (categorySlugMap[name]) {
      return categorySlugMap[name];
    }
    
    // Try to extract English part from strings like "بک‌اند و سرور (Backend & APIs)"
    const englishMatch = name.match(/\(([^)]+)\)/);
    if (englishMatch && englishMatch[1]) {
      return englishMatch[1]
        .toLowerCase()
        .replace(/[^a-z0-9\s&]+/g, '')
        .replace(/\s+/g, '-')
        .replace(/&/g, 'and')
        .replace(/^-+|-+$/g, '');
    }
    
    // Fallback: remove non-ASCII characters and create slug
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]+/g, '') // Remove non-ASCII characters
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function handleNameChange(name: string) {
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name),
      seo: {
        ...prev.seo,
        metaTitle: prev.seo.metaTitle || name
      }
    }));
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      alert('نام الزامی است');
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        name: formData.name,
        slug: formData.slug || generateSlug(formData.name),
        description: formData.description || '',
        seo: formData.seo
      };
      
      // Only include parentId if it's set
      if (formData.parentId) {
        payload.parentId = formData.parentId;
      } else {
        payload.parentId = null;
      }
      
      const res = isNew 
        ? await createCategory(payload)
        : await updateCategory(id, payload);
      
      if (res.ok) {
        router.push('/categories');
      } else {
        alert(res.error || 'خطا در ذخیره');
      }
    } catch (e) {
      alert('خطا در ذخیره');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-6">در حال بارگذاری...</div>;
  }

  return (
    <div className="space-y-4 lg:space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">{isNew ? 'ایجاد دسته‌بندی جدید' : 'ویرایش دسته‌بندی'}</h1>
          <p className="text-gray-600 mt-1 text-sm lg:text-base">{isNew ? 'دسته‌بندی جدید ایجاد کنید' : 'ویرایش دسته‌بندی'}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 border rounded-md hover:bg-gray-50 text-sm lg:text-base whitespace-nowrap"
          >
            انصراف
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm lg:text-base whitespace-nowrap"
          >
            {saving ? 'در حال ذخیره...' : 'ذخیره'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6 space-y-4 lg:space-y-6">
        {/* اطلاعات پایه */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">اطلاعات پایه</h2>
          
          <div>
            <label className="block text-sm font-medium mb-1">نام *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="نام دسته‌بندی"
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
            <label className="block text-sm font-medium mb-1">توضیحات</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md"
              rows={4}
              placeholder="توضیحات دسته‌بندی"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">دسته‌بندی والد (اختیاری)</label>
            <select
              value={formData.parentId}
              onChange={(e) => setFormData(prev => ({ ...prev, parentId: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">بدون دسته‌بندی والد (دسته‌بندی اصلی)</option>
              {allCategories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              انتخاب دسته‌بندی والد این دسته‌بندی را به زیردسته تبدیل می‌کند
            </p>
          </div>
        </div>

        {/* SEO Settings */}
        <div className="space-y-4 border-t pt-6">
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
              placeholder="عنوان برای SEO"
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
              placeholder="توضیحات برای SEO"
            />
            <p className="text-xs text-gray-500 mt-1">{formData.seo.metaDescription.length} کاراکتر</p>
          </div>
        </div>
      </div>
    </div>
  );
}

