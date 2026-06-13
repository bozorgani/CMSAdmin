import Link from 'next/link';
import { FileText, Folder, Tag, Image as ImageIcon, TrendingUp, Users, Eye } from 'lucide-react';
import { API_BASE, API_PREFIX, DEFAULT_PAGE_SIZE } from '@/lib/constants';
import type { DashboardStats, Post } from '@/types';

async function fetchTotals(): Promise<DashboardStats> {
  try {
    const [allRes, draftsRes, publishedRes, scheduledRes, catsRes, tagsRes, mediaRes, recentRes] =
      await Promise.all([
        fetch(`${API_BASE}${API_PREFIX}/posts?status=all&limit=1`, {
          next: { revalidate: 30 },
        })
          .then((r) => r.json())
          .catch(() => ({})),
        fetch(`${API_BASE}${API_PREFIX}/posts?status=draft&limit=1`, {
          next: { revalidate: 30 },
        })
          .then((r) => r.json())
          .catch(() => ({})),
        fetch(`${API_BASE}${API_PREFIX}/posts?status=published&limit=1`, {
          next: { revalidate: 30 },
        })
          .then((r) => r.json())
          .catch(() => ({})),
        fetch(`${API_BASE}${API_PREFIX}/posts?status=scheduled&limit=1`, {
          next: { revalidate: 30 },
        })
          .then((r) => r.json())
          .catch(() => ({})),
        fetch(`${API_BASE}${API_PREFIX}/categories?limit=1`, {
          next: { revalidate: 60 },
        })
          .then((r) => r.json())
          .catch(() => ({})),
        fetch(`${API_BASE}${API_PREFIX}/tags?limit=1`, {
          next: { revalidate: 60 },
        })
          .then((r) => r.json())
          .catch(() => ({})),
        fetch(`${API_BASE}${API_PREFIX}/media?limit=1`, {
          next: { revalidate: 60 },
        })
          .then((r) => r.json())
          .catch(() => ({})),
        fetch(`${API_BASE}${API_PREFIX}/posts?status=all&limit=3`, {
          next: { revalidate: 30 },
        })
          .then((r) => r.json())
          .catch(() => ({ items: [] })),
      ]);

    return {
      totalPosts: Number(allRes?.total || 0),
      totalDrafts: Number(draftsRes?.total || 0),
      totalPublished: Number(publishedRes?.total || 0),
      totalScheduled: Number(scheduledRes?.total || 0),
      totalCategories: Number(catsRes?.total ?? (catsRes?.items?.length ?? 0)),
      totalTags: Number(tagsRes?.total ?? (tagsRes?.items?.length ?? 0)),
      totalMedia: Number(mediaRes?.total ?? (mediaRes?.items?.length ?? 0)),
      recentPosts: Array.isArray(recentRes?.items) ? (recentRes.items as Post[]) : [],
    };
  } catch {
    return {
      totalPosts: 0,
      totalDrafts: 0,
      totalPublished: 0,
      totalScheduled: 0,
      totalCategories: 0,
      totalTags: 0,
      totalMedia: 0,
      recentPosts: [],
    };
  }
}

export default async function HomePage() {
  const data = await fetchTotals();

  const stats = [
    {
      label: 'پست‌ها',
      value: String(data.totalPosts),
      icon: FileText,
      color: 'bg-blue-500',
      href: '/posts',
    },
    {
      label: 'دسته‌بندی‌ها',
      value: String(data.totalCategories),
      icon: Folder,
      color: 'bg-green-500',
      href: '/categories',
    },
    {
      label: 'برچسب‌ها',
      value: String(data.totalTags),
      icon: Tag,
      color: 'bg-purple-500',
      href: '/tags',
    },
    {
      label: 'رسانه',
      value: String(data.totalMedia),
      icon: ImageIcon,
      color: 'bg-orange-500',
      href: '/media',
    },
  ];

  const quickActions = [
    { label: 'ایجاد پست جدید', href: '/posts/new', icon: FileText, color: 'bg-blue-600 hover:bg-blue-700' },
    { label: 'ایجاد دسته‌بندی', href: '/categories/new', icon: Folder, color: 'bg-green-600 hover:bg-green-700' },
    { label: 'ایجاد برچسب', href: '/tags/new', icon: Tag, color: 'bg-purple-600 hover:bg-purple-700' },
    { label: 'آپلود رسانه', href: '/media', icon: ImageIcon, color: 'bg-orange-600 hover:bg-orange-700' },
  ];

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 lg:p-8 text-white shadow-lg">
        <h1 className="text-2xl lg:text-3xl font-bold mb-2">خوش آمدید به پنل مدیریت</h1>
        <p className="text-blue-100 text-sm lg:text-base">به پنل مدیریت محتوای بلاگ خود خوش آمدید</p>
        <div className="mt-3 text-xs text-blue-200 flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          <span>🔒 اتصال امن با HttpOnly Cookie</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all hover:border-blue-300 group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div
                  className={`${stat.color} p-4 rounded-lg group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border border-gray-200">
        <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4">دسترسی سریع</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className={`${action.color} text-white rounded-lg p-4 flex items-center gap-3 transition-all shadow-sm hover:shadow-md`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{action.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4">آخرین پست‌ها</h2>
          {data.recentPosts.length === 0 ? (
            <p className="text-gray-500 text-sm">هنوز پستی ایجاد نشده است.</p>
          ) : (
            <div className="space-y-3">
              {data.recentPosts.map((p) => (
                <div
                  key={p._id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{p.title}</p>
                    <p className="text-sm text-gray-500">
                      {(p.publishAt || p.createdAt) &&
                        new Date(p.publishAt || p.createdAt!).toLocaleDateString('fa-IR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link
            href="/posts"
            className="block mt-4 text-center text-blue-600 hover:text-blue-700 font-medium"
          >
            مشاهده همه پست‌ها →
          </Link>
        </div>

        <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4">آمار کلی</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-blue-600" />
                <span className="text-gray-700">بازدید کل</span>
              </div>
              <span className="text-2xl font-bold text-blue-600">1,234</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-gray-700">پست‌های منتشر شده</span>
              </div>
              <span className="text-2xl font-bold text-green-600">{data.totalPublished}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-purple-600" />
                <span className="text-gray-700">پست‌های پیش‌نویس</span>
              </div>
              <span className="text-2xl font-bold text-purple-600">{data.totalDrafts}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-yellow-600" />
                <span className="text-gray-700">زمان‌بندی شده</span>
              </div>
              <span className="text-2xl font-bold text-yellow-600">{data.totalScheduled}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Security info */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
        <div className="text-2xl">🔒</div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">امنیت پیشرفته</h3>
          <p className="text-xs text-gray-700">
            توکن احراز هویت شما در HttpOnly Cookie ذخیره می‌شود و از دسترسی JavaScript محافظت می‌شود.
            این کار از حملات XSS جلوگیری می‌کند.
          </p>
        </div>
      </div>

      {/* Performance hint */}
      <div className="text-xs text-gray-500 text-center">
        نمایش حداکثر {DEFAULT_PAGE_SIZE} مورد در هر صفحه
      </div>
    </div>
  );
}
