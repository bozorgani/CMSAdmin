import './globals.css';
import type { ReactNode } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { PageWrapper } from '@/components/PageWrapper';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <AuthGuard>
          <PageWrapper>
            {children}
          </PageWrapper>
        </AuthGuard>
      </body>
    </html>
  );
}


