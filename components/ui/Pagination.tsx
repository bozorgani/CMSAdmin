'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  total?: number;
  limit?: number;
}

export function Pagination({ page, totalPages, onPageChange, total, limit }: PaginationProps) {
  if (totalPages <= 1) return null;

  const start = total !== undefined && limit !== undefined ? (page - 1) * limit + 1 : 0;
  const end = total !== undefined && limit !== undefined ? Math.min(page * limit, total) : 0;

  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);
    if (page > 3) pages.push('...');

    const startPage = Math.max(2, page - 1);
    const endPage = Math.min(totalPages - 1, page + 1);
    for (let i = startPage; i <= endPage; i++) pages.push(i);

    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t">
      <div className="text-sm text-gray-600">
        {total !== undefined && limit !== undefined && total > 0 ? (
          <>
            نمایش <span className="font-medium">{start}</span> تا{' '}
            <span className="font-medium">{end}</span> از{' '}
            <span className="font-medium">{total}</span> مورد
          </>
        ) : null}
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="px-3 py-1 text-sm rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          aria-label="صفحه قبل"
        >
          <ChevronRight className="w-4 h-4" />
          قبلی
        </button>
        {pages.map((p, i) =>
          typeof p === 'string' ? (
            <span key={`dots-${i}`} className="px-2 text-gray-400">
              …
            </span>
          ) : (
            <button
              type="button"
              key={p}
              onClick={() => onPageChange(p)}
              className={`min-w-[36px] px-2 py-1 text-sm rounded border ${
                p === page
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          )
        )}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="px-3 py-1 text-sm rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          aria-label="صفحه بعد"
        >
          بعدی
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
