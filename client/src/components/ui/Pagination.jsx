import React from 'react';

export default function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  showInfo = true,
  className = ''
}) {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className={`pagination-container ${className}`}>
      {/* Previous Button */}
      <button
        className="pagination-button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Previous
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {visiblePages.map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="px-3 py-2 text-slate-400">...</span>
            ) : (
              <button
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  page === currentPage
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
                onClick={() => onPageChange(page)}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Next Button */}
      <button
        className="pagination-button"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next
        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Page Info */}
      {showInfo && (
        <div className="pagination-info ml-4">
          Page {currentPage} of {totalPages}
        </div>
      )}
    </div>
  );
}