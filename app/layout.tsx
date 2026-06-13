import './globals.css';
import type { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import { AuthGuard } from '@/components/AuthGuard';
import { PageWrapper } from '@/components/PageWrapper';
import { Providers } from '@/components/Providers';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export const metadata: Metadata = {
  title: 'پنل مدیریت CMS',
  description: 'پنل مدیریت محتوای بلاگ',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2563eb',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <Providers>
          <ErrorBoundary>
            <AuthGuard>
              <PageWrapper>{children}</PageWrapper>
            </AuthGuard>
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
