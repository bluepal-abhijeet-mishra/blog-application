import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange, className = "" }) => {
  if (totalPages === 0) return null;

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(0, currentPage - 2);
    let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(0, endPage - maxVisiblePages + 1);
    }

    if (startPage > 0) {
      pages.push(
        <button
          key={0}
          onClick={() => onPageChange(0)}
          className={`size-10 rounded-xl text-xs font-black transition-all text-slate-400 hover:text-primary`}
        >
          1
        </button>
      );
      if (startPage > 1) {
        pages.push(<span key="dots-1" className="text-slate-300 px-1">...</span>);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`size-10 rounded-xl text-xs font-black transition-all ${
            currentPage === i 
              ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110' 
              : 'text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
        >
          {i + 1}
        </button>
      );
    }

    if (endPage < totalPages - 1) {
      if (endPage < totalPages - 2) {
        pages.push(<span key="dots-2" className="text-slate-300 px-1">...</span>);
      }
      pages.push(
        <button
          key={totalPages - 1}
          onClick={() => onPageChange(totalPages - 1)}
          className={`size-10 rounded-xl text-xs font-black transition-all text-slate-400 hover:text-primary`}
        >
          {totalPages}
        </button>
      );
    }

    return pages;
  };

  return (
    <div className={`flex items-center justify-between py-8 border-t border-slate-100 dark:border-slate-800/50 ${className}`}>
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
        Showing <span className="text-slate-900 dark:text-white">Page {currentPage + 1}</span> of {totalPages}
      </div>
      
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
          className="size-10 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:border-primary/30 hover:text-primary transition-all disabled:opacity-20 disabled:cursor-not-allowed group"
          title="Previous Page"
        >
          <span className="material-symbols-outlined text-xl group-hover:-translate-x-0.5 transition-transform">chevron_left</span>
        </button>

        <div className="flex items-center gap-1.5 mx-2">
          {renderPageNumbers()}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages - 1}
          className="size-10 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:border-primary/30 hover:text-primary transition-all disabled:opacity-20 disabled:cursor-not-allowed group"
          title="Next Page"
        >
          <span className="material-symbols-outlined text-xl group-hover:translate-x-0.5 transition-transform">chevron_right</span>
        </button>
      </div>
    </div>
  );
};

export default Pagination;
