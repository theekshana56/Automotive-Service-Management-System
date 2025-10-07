import React from 'react';

const DataTable = ({ 
  columns = [], 
  data = [], 
  loading = false, 
  emptyMessage = "No data available",
  className = ""
}) => {
  if (loading) {
    return (
      <div className={`card ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <span className="ml-3 text-slate-300">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`card overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              {columns.map((column, index) => (
                <th 
                  key={index}
                  className="text-left p-4 text-sm font-medium text-slate-300 border-b border-white/5"
                  style={{ width: column.width }}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.length} 
                  className="text-center py-12 text-slate-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr 
                  key={rowIndex} 
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  {columns.map((column, colIndex) => (
                    <td key={colIndex} className="p-4 text-sm text-slate-200">
                      {column.render ? column.render(row, rowIndex) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;