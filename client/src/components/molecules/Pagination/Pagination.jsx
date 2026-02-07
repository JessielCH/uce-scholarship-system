import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * MOLECULE: Pagination
 */
const Pagination = ({
  currentPage,
  totalPages,
  onPrev,
  onNext,
  onPageChange = null,
  showPageNumbers = true,
  className = "",
  ...props
}) => {
  const visiblePages = [];
  const maxVisible = 5;

  if (totalPages <= maxVisible) {
    for (let i = 0; i < totalPages; i++) {
      visiblePages.push(i);
    }
  } else {
    const half = Math.floor(maxVisible / 2);
    let start = Math.max(0, currentPage - half);
    let end = Math.min(totalPages, start + maxVisible);

    if (end - start < maxVisible) {
      start = Math.max(0, end - maxVisible);
    }

    for (let i = start; i < end; i++) {
      visiblePages.push(i);
    }
  }

  return (
    <div
      className={`flex items-center justify-center gap-2 flex-wrap ${className}`}
      {...props}
    >
      <button
        onClick={onPrev}
        disabled={currentPage === 0}
        className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={18} />
      </button>

      {showPageNumbers &&
        visiblePages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange?.(page)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              currentPage === page
                ? "bg-brand-blue text-white"
                : "hover:bg-gray-100 text-gray-700"
            }`}
          >
            {page + 1}
          </button>
        ))}

      <button
        onClick={onNext}
        disabled={currentPage === totalPages - 1}
        className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight size={18} />
      </button>

      <span className="text-xs text-gray-500 ml-2">
        Page {currentPage + 1} of {totalPages}
      </span>
    </div>
  );
};

export default Pagination;
