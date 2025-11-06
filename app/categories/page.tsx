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
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">دسته‌بندی‌ها</h1>
          <p className="text-gray-600 mt-1 text-sm lg:text-base">مدیریت دسته‌بندی‌های بلاگ</p>
        </div>
        <button
          onClick={() => router.push('/categories/new')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm hover:shadow-md transition-all font-medium text-sm lg:text-base whitespace-nowrap"
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
          className="w-full px-3 py-2 border rounded-md text-sm lg:text-base"
        />
      </div>

      {/* جدول دسته‌بندی‌ها */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="p-3 lg:p-4 text-right whitespace-nowrap">نام</th>
                <th className="p-3 lg:p-4 text-right whitespace-nowrap hidden md:table-cell">اسلاگ</th>
                <th className="p-3 lg:p-4 text-right whitespace-nowrap hidden lg:table-cell">توضیحات</th>
                <th className="p-3 lg:p-4 text-right whitespace-nowrap">عملیات</th>
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
                    <td className="p-3 lg:p-4 font-medium">
                      <div className="max-w-xs truncate lg:max-w-none">{cat.name}</div>
                      <div className="md:hidden text-xs text-gray-500 mt-1">{cat.slug}</div>
                      <div className="lg:hidden text-xs text-gray-500 mt-1">{cat.description || '-'}</div>
                    </td>
                    <td className="p-3 lg:p-4 text-gray-600 hidden md:table-cell">{cat.slug}</td>
                    <td className="p-3 lg:p-4 text-gray-600 hidden lg:table-cell">{cat.description || '-'}</td>
                    <td className="p-3 lg:p-4">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => router.push(`/categories/${cat._id}`)}
                          className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 whitespace-nowrap"
                        >
                          ویرایش
                        </button>
                        <button
                          onClick={() => handleDelete(cat._id)}
                          className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 whitespace-nowrap"
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
    </div>
  );
}

