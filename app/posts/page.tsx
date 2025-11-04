'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { listPosts, deletePost } from '@/lib/api';

type Post = {
  _id: string;
  title: string;
  slug: string;
  status: string;
  publishAt?: string;
  createdAt?: string;
};

export default function PostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadPosts();
  }, [statusFilter]);

  async function loadPosts() {
    setLoading(true);
    const res = await listPosts({
      status: statusFilter === 'all' ? 'all' : statusFilter,
      limit: 50
    });
    if (res.ok && res.items) {
      setPosts(res.items);
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('آیا از حذف این پست اطمینان دارید؟')) return;
    const res = await deletePost(id);
    if (res.ok) {
      loadPosts();
    } else {
      alert(res.error || 'خطا در حذف پست');
    }
  }

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800',
      scheduled: 'bg-yellow-100 text-yellow-800',
      published: 'bg-green-100 text-green-800'
    };
    const labels = {
      draft: 'پیش‌نویس',
      scheduled: 'زمان‌بندی',
      published: 'منتشر شده'
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status as keyof typeof styles] || 'bg-gray-100'}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">پست‌ها</h1>
          <p className="text-gray-600 mt-1">مدیریت و ویرایش پست‌های بلاگ</p>
        </div>
        <button
          onClick={() => router.push('/posts/new')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm hover:shadow-md transition-all font-medium"
        >
          + ایجاد پست جدید
        </button>
      </div>

      {/* فیلترها */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="جستجو در عنوان یا اسلاگ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="draft">پیش‌نویس</option>
              <option value="scheduled">زمان‌بندی شده</option>
              <option value="published">منتشر شده</option>
            </select>
          </div>
        </div>
      </div>

      {/* جدول پست‌ها */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="p-4 text-right">عنوان</th>
              <th className="p-4 text-right">اسلاگ</th>
              <th className="p-4 text-right">وضعیت</th>
              <th className="p-4 text-right">تاریخ انتشار</th>
              <th className="p-4 text-right">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-4 text-center" colSpan={5}>در حال بارگذاری...</td>
              </tr>
            ) : filteredPosts.length === 0 ? (
              <tr>
                <td className="p-4 text-center" colSpan={5}>پستی یافت نشد</td>
              </tr>
            ) : (
              filteredPosts.map((p) => (
                <tr key={p._id} className="border-t hover:bg-gray-50">
                  <td className="p-4 font-medium">{p.title}</td>
                  <td className="p-4 text-gray-600">{p.slug}</td>
                  <td className="p-4">{getStatusBadge(p.status)}</td>
                  <td className="p-4 text-gray-600 text-xs">
                    {p.publishAt ? new Date(p.publishAt).toLocaleDateString('fa-IR') : '-'}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/posts/${p._id}`)}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        ویرایش
                      </button>
                      <button
                        onClick={() => handleDelete(p._id)}
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


