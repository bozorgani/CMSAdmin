'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow-lg border border-red-200 p-8 max-w-md text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">خطایی رخ داد</h2>
        <p className="text-gray-600 mb-4 text-sm">
          {error.message || 'مشکلی در بارگذاری این صفحه به وجود آمده است.'}
        </p>
        <button
          type="button"
          onClick={reset}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          تلاش مجدد
        </button>
      </div>
    </div>
  );
}
