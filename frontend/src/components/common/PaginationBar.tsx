import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationBarProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  label?: string;
}

export const PaginationBar: React.FC<PaginationBarProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  label = 'mục'
}) => {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Pagination logic to show ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const navButtonClass = "flex items-center justify-center p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors";
  const disabledButtonClass = "opacity-30 cursor-not-allowed";

  return (
    <div className="flex items-center justify-between border-t border-slate-800 pt-4 mt-4 w-full">
      <div className="text-xs text-slate-400">
        Hiển thị {startItem}–{endItem} / {totalItems} {label}
      </div>

      <div className="flex items-center space-x-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={`${navButtonClass} ${currentPage === 1 ? disabledButtonClass : ''}`}
          aria-label="Đầu"
        >
          <ChevronsLeft size={16} />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`${navButtonClass} ${currentPage === 1 ? disabledButtonClass : ''}`}
          aria-label="Trước"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="hidden sm:flex items-center space-x-1">
          {getPageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="text-xs text-slate-500 px-1">...</span>
              ) : (
                <button
                  onClick={() => onPageChange(page as number)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`${navButtonClass} ${currentPage === totalPages ? disabledButtonClass : ''}`}
          aria-label="Sau"
        >
          <ChevronRight size={16} />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={`${navButtonClass} ${currentPage === totalPages ? disabledButtonClass : ''}`}
          aria-label="Cuối"
        >
          <ChevronsRight size={16} />
        </button>
      </div>
    </div>
  );
};
