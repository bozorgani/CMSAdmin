'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { listTags, deleteTag } from '@/lib/api';

type Tag = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
};

export default function TagsPage() {
  const router = useRouter();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadTags();
  }, []);

  async function loadTags() {
    setLoading(true);
    const res = await listTags();
    if (res.ok && res.items) {
      setTags(res.items);
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('آیا از حذف این برچسب اطمینان دارید؟')) return;
    const res = await deleteTag(id);
    if (res.ok) {
      loadTags();
    } else {
      alert(res.error || 'خطا در حذف برچسب');
    }
  }

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tag.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">برچسب‌ها</h1>
          <p className="text-gray-600 mt-1 text-sm lg:text-base">مدیریت برچسب‌های بلاگ</p>
        </div>
        <button
          onClick={() => router.push('/tags/new')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm hover:shadow-md transition-all font-medium text-sm lg:text-base whitespace-nowrap"
        >
          + ایجاد برچسب جدید
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

      {/* جدول برچسب‌ها */}
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
              ) : filteredTags.length === 0 ? (
                <tr>
                  <td className="p-4 text-center" colSpan={4}>برچسبی یافت نشد</td>
                </tr>
              ) : (
                filteredTags.map((tag) => (
                  <tr key={tag._id} className="border-t hover:bg-gray-50">
                    <td className="p-3 lg:p-4 font-medium">
                      <div className="max-w-xs truncate lg:max-w-none">{tag.name}</div>
                      <div className="md:hidden text-xs text-gray-500 mt-1">{tag.slug}</div>
                      <div className="lg:hidden text-xs text-gray-500 mt-1">{tag.description || '-'}</div>
                    </td>
                    <td className="p-3 lg:p-4 text-gray-600 hidden md:table-cell">{tag.slug}</td>
                    <td className="p-3 lg:p-4 text-gray-600 hidden lg:table-cell">{tag.description || '-'}</td>
                    <td className="p-3 lg:p-4">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => router.push(`/tags/${tag._id}`)}
                          className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 whitespace-nowrap"
                        >
                          ویرایش
                        </button>
                        <button
                          onClick={() => handleDelete(tag._id)}
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

