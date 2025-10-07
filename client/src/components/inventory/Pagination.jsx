import React from 'react';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  className = "",
  showInfo = true 
}) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {showInfo && (
        <div className="text-sm text-slate-400">
          Page {currentPage} of {totalPages}
        </div>
      )}
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="btn-secondary px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ←
        </button>
        
        {getPageNumbers().map((page, index) => (
          page === '...' ? (
            <span key={index} className="px-3 py-2 text-slate-400">
              ...
            </span>
          ) : (
            <button
              key={index}
              onClick={() => onPageChange(page)}
              className={`px-3 py-2 rounded-lg transition-colors ${
                currentPage === page
                  ? 'bg-primary text-slate-900 font-medium'
                  : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              {page}
            </button>
          )
        ))}
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="btn-secondary px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          →
        </button>
      </div>
    </div>
  );
};

export default Pagination;