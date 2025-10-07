import React from 'react';
import LoadingSpinner from './LoadingSpinner';

export default function DataTable({ 
  columns, 
  data, 
  loading = false, 
  emptyMessage = 'No data available',
  onRowClick,
  className = ''
}) {
  if (loading) {
    return (
      <div className="table-responsive">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="table-responsive">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-6xl mb-4 opacity-50">📋</div>
          <p className="text-slate-400 text-lg">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`table-responsive overflow-x-auto ${className}`}>
      <table className="inventory-table min-w-full">
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th 
                key={index}
                className={`${column.className || ''} ${column.sortable ? 'cursor-pointer hover:bg-white/5' : ''}`}
                style={{ width: column.width }}
                onClick={column.sortable ? column.onSort : undefined}
              >
                <div className="flex items-center gap-2">
                  {column.label}
                  {column.sortable && (
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    </svg>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr 
              key={rowIndex}
              className={`${onRowClick ? 'cursor-pointer hover:bg-white/5' : ''}`}
              onClick={() => onRowClick?.(row, rowIndex)}
            >
              {columns.map((column, colIndex) => (
                <td key={colIndex} className={column.cellClassName || ''}>
                  {column.render ? column.render(row, rowIndex) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}