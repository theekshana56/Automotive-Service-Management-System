import React, { useState } from 'react';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function EnhancedDataTable({ 
  columns, 
  data, 
  loading = false, 
  emptyMessage = 'No data available',
  onRowClick,
  className = '',
  showExport = false,
  onExport
}) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) return data;
    
    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  if (loading) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-24 h-24 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-300 mb-2">No Data Found</h3>
            <p className="text-slate-500 text-center max-w-md">{emptyMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`card ${className}`}>
      {/* Table Header */}
      <div className="card-header">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-accent/10">
            <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h3 className="card-title">Report Data</h3>
            <p className="card-subtitle">{data.length} records found</p>
          </div>
        </div>

        {showExport && (
          <div className="flex gap-2">
            <button 
              className="btn-secondary"
              onClick={() => onExport?.('csv')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              CSV
            </button>
            <button 
              className="btn-secondary"
              onClick={() => onExport?.('pdf')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              PDF
            </button>
          </div>
        )}
      </div>

      {/* Table Content */}
      <div className="card-body p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {columns.map((column, index) => (
                  <th 
                    key={index}
                    className={`px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider ${
                      column.sortable ? 'cursor-pointer hover:text-slate-300 select-none' : ''
                    }`}
                    onClick={column.sortable ? () => handleSort(column.key) : undefined}
                  >
                    <div className="flex items-center gap-2">
                      {column.label}
                      {column.sortable && (
                        <div className="flex flex-col">
                          <svg 
                            className={`w-3 h-3 ${
                              sortConfig.key === column.key && sortConfig.direction === 'asc' 
                                ? 'text-primary' 
                                : 'text-slate-600'
                            }`} 
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                          >
                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sortedData.map((row, rowIndex) => (
                <tr 
                  key={rowIndex}
                  className={`transition-colors duration-150 ${
                    onRowClick 
                      ? 'cursor-pointer hover:bg-white/5 active:bg-white/10' 
                      : ''
                  }`}
                  onClick={() => onRowClick?.(row, rowIndex)}
                >
                  {columns.map((column, colIndex) => (
                    <td 
                      key={colIndex} 
                      className={`px-6 py-4 whitespace-nowrap text-sm ${
                        column.cellClassName || 'text-slate-300'
                      }`}
                    >
                      {column.render ? column.render(row, rowIndex) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}