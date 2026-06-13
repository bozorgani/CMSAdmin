'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Folder,
  Tag,
  Image as ImageIcon,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { logout, fetchCurrentUser } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import type { User } from '@/types';

interface LayoutProps {
  children: ReactNode;
}

interface MenuItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const MENU_ITEMS: MenuItem[] = [
  { href: '/', label: 'داشبورد', icon: LayoutDashboard },
  { href: '/posts', label: 'پست‌ها', icon: FileText },
  { href: '/categories', label: 'دسته‌بندی‌ها', icon: Folder },
  { href: '/tags', label: 'برچسب‌ها', icon: Tag },
  { href: '/media', label: 'رسانه', icon: ImageIcon },
];

export function Layout({ children }: LayoutProps) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchCurrentUser().then(setUser);
  }, []);

  const isActive = (href: string): boolean => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href) ?? false;
  };

  const closeSidebar = () => setSidebarOpen(false);

  const handleLogout = async () => {
    closeSidebar();
    toast.info('در حال خروج...', 'خداحافظ');
    await logout();
    // logout() redirects to /login
  };

  const activeLabel = MENU_ITEMS.find((item) => isActive(item.href))?.label || 'داشبورد';
  const userInitial =
    user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed right-0 top-0 h-full w-64 bg-white border-l border-gray-200 shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        } lg:translate-x-0`}
        aria-label="منوی اصلی"
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-4 lg:p-6 border-b border-gray-200 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3" onClick={closeSidebar}>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">C</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">CMS Admin</h1>
                <p className="text-xs text-gray-500">پنل مدیریت</p>
              </div>
            </Link>
            <button
              type="button"
              onClick={closeSidebar}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              aria-label="بستن منو"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-2">
              {MENU_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={closeSidebar}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        active
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600 font-medium'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      aria-current={active ? 'page' : undefined}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <Link
              href="/settings"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-all"
              onClick={closeSidebar}
            >
              <Settings className="w-5 h-5" />
              <span>تنظیمات</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all mt-2"
            >
              <LogOut className="w-5 h-5" />
              <span>خروج</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:mr-64 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
          <div className="px-4 lg:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                  aria-label="باز کردن منو"
                >
                  <Menu className="w-6 h-6" />
                </button>
                <div>
                  <h2 className="text-lg lg:text-xl font-semibold text-gray-900">{activeLabel}</h2>
                </div>
              </div>
              <div className="flex items-center gap-2 lg:gap-4">
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.name || user?.email || 'کاربر'}
                  </p>
                  <p className="text-xs text-gray-500">{user?.role || 'مدیر'}</p>
                </div>
                <div
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium"
                  aria-hidden="true"
                >
                  {userInitial}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
