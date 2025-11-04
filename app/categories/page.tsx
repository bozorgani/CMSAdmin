'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { listCategories, deleteCategory } from '@/lib/api';

type Category = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
};

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    setLoading(true);
    const res = await listCategories();
    if (res.ok && res.items) {
      setCategories(res.items);
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('آیا از حذف این دسته‌بندی اطمینان دارید؟')) return;
    const res = await deleteCategory(id);
    if (res.ok) {
      loadCategories();
    } else {
      alert(res.error || 'خطا در حذف دسته‌بندی');
    }
  }

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">دسته‌بندی‌ها</h1>
          <p className="text-gray-600 mt-1">مدیریت دسته‌بندی‌های بلاگ</p>
        </div>
        <button
          onClick={() => router.push('/categories/new')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm hover:shadow-md transition-all font-medium"
        >
          + ایجاد دسته‌بندی جدید
        </button>
      </div>

      {/* جستجو */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <input
          type="text"
          placeholder="جستجو در نام یا اسلاگ..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>

      {/* جدول دسته‌بندی‌ها */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="p-4 text-right">نام</th>
              <th className="p-4 text-right">اسلاگ</th>
              <th className="p-4 text-right">توضیحات</th>
              <th className="p-4 text-right">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-4 text-center" colSpan={4}>در حال بارگذاری...</td>
              </tr>
            ) : filteredCategories.length === 0 ? (
              <tr>
                <td className="p-4 text-center" colSpan={4}>دسته‌بندی‌ای یافت نشد</td>
              </tr>
            ) : (
              filteredCategories.map((cat) => (
                <tr key={cat._id} className="border-t hover:bg-gray-50">
                  <td className="p-4 font-medium">{cat.name}</td>
                  <td className="p-4 text-gray-600">{cat.slug}</td>
                  <td className="p-4 text-gray-600">{cat.description || '-'}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/categories/${cat._id}`)}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        ویرایش
                      </button>
                      <button
                        onClick={() => handleDelete(cat._id)}
                        className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

