'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Layout } from './Layout';

interface PageWrapperProps {
  children: ReactNode;
}

export function PageWrapper({ children }: PageWrapperProps) {
  const pathname = usePathname();
  
  // Pages that should render without Layout
  const isLoginPage = pathname === '/login';
  const isPreviewPage = pathname?.includes('/preview');
  
  if (isLoginPage || isPreviewPage) {
    return <>{children}</>;
  }

  return <Layout>{children}</Layout>;
}

