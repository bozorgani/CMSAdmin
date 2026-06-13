'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { fetchCurrentUser } from '@/lib/api';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAuth() {
      const user = await fetchCurrentUser();
      const isAuth = !!user;

      if (!isAuth && pathname !== '/login') {
        router.replace('/login');
      } else if (isAuth && pathname === '/login') {
        router.replace('/');
      } else {
        setIsAuthenticated(isAuth);
      }
    }
    checkAuth();
  }, [pathname, router]);

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"
            aria-hidden="true"
          />
          <p className="mt-4 text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (pathname === '/login') {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
