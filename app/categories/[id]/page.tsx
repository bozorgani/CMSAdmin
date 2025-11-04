'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCategory, createCategory, updateCategory } from '@/lib/api';

export default function CategoryEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const isNew = id === 'new';
  
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    seo: {
      metaTitle: '',
      metaDescription: ''
    }
  });

  useEffect(() => {
    if (!isNew) {
      loadCategory();
    }
  }, [id]);

  async function loadCategory() {
    if (!id) return;
    const res = await getCategory(id);
    if (res.ok && res.category) {
      const cat = res.category;
      setFormData({
        name: cat.name || '',
        slug: cat.slug || '',
        description: cat.description || '',
        seo: {
          metaTitle: cat.seo?.metaTitle || '',
          metaDescription: cat.seo?.metaDescription || ''
        }
      });
    }
    setLoading(false);
  }

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
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
      const payload = {
        ...formData,
        slug: formData.slug || generateSlug(formData.name)
      };
      
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

