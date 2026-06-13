import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="text-6xl font-bold text-gray-300 mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">صفحه یافت نشد</h1>
        <p className="text-gray-600 mb-6">صفحه‌ای که جستجو می‌کنید وجود ندارد یا حذف شده است.</p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          بازگشت به داشبورد
        </Link>
      </div>
    </div>
  );
}
