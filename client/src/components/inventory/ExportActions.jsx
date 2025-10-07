import React, { useState } from 'react';

export default function ExportActions({ 
  onExport, 
  loading = false,
  showCSV = true,
  className = '' 
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const exportOptions = [
    showCSV && {
      key: 'csv',
      label: 'Export as CSV',
      description: 'Comma-separated values file',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      key: 'pdf',
      label: 'Export as PDF',
      description: 'Portable document format',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
    }
  ].filter(Boolean);

  const handleExport = async (type) => {
    setIsDropdownOpen(false);
    await onExport?.(type);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        className="btn-secondary flex items-center gap-2"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        disabled={loading}
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
        Export
        <svg 
          className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-surface border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="p-2">
            <div className="text-xs uppercase tracking-wide text-slate-400 px-3 py-2 mb-1">
              Export Options
            </div>
            {exportOptions.map((option) => (
              <button
                key={option.key}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/5 transition-colors duration-150 text-left"
                onClick={() => handleExport(option.key)}
              >
                <div className="p-2 rounded-lg bg-white/5 text-slate-400">
                  {option.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-200">
                    {option.label}
                  </div>
                  <div className="text-xs text-slate-500">
                    {option.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
}