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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">برچسب‌ها</h1>
          <p className="text-gray-600 mt-1">مدیریت برچسب‌های بلاگ</p>
        </div>
        <button
          onClick={() => router.push('/tags/new')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm hover:shadow-md transition-all font-medium"
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
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>

      {/* جدول برچسب‌ها */}
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
            ) : filteredTags.length === 0 ? (
              <tr>
                <td className="p-4 text-center" colSpan={4}>برچسبی یافت نشد</td>
              </tr>
            ) : (
              filteredTags.map((tag) => (
                <tr key={tag._id} className="border-t hover:bg-gray-50">
                  <td className="p-4 font-medium">{tag.name}</td>
                  <td className="p-4 text-gray-600">{tag.slug}</td>
                  <td className="p-4 text-gray-600">{tag.description || '-'}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/tags/${tag._id}`)}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        ویرایش
                      </button>
                      <button
                        onClick={() => handleDelete(tag._id)}
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

