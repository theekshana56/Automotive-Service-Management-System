import React from 'react';
import StatusBadge from '../ui/StatusBadge';
import LoadingSpinner from '../ui/LoadingSpinner';
// Utility function for formatting currency
const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount || 0);
};

export default function PartListTable({ 
  data, 
  onEdit = () => {}, 
  onDeactivate = () => {}, 
  onActivate = () => {},
  onDelete = () => {},
  loading = false 
}) {
  const items = data?.items || [];

  if (loading) {
    return (
      <div className="table-responsive">
        <LoadingSpinner size="lg" text="Loading parts..." />
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="table-responsive">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-6xl mb-4 opacity-50">🔧</div>
          <p className="text-slate-400 text-lg">No parts found</p>
          <p className="text-slate-500 text-sm mt-2">Try adjusting your search or filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="inventory-table">
        <thead>
          <tr>
            <th className="w-1/4">Part Details</th>
            <th className="w-1/6">Category</th>
            <th className="w-1/5">Stock Info</th>
            <th className="w-1/6">Price</th>
            <th className="w-1/10">Status</th>
            <th className="w-1/6">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((part) => {
            const onHand = part.stock?.onHand || 0;
            const reorderLevel = part.stock?.reorderLevel || 0;
            const isLowStock = onHand <= reorderLevel;
            const stockStatus = isLowStock ? 'Low Stock' : 'In Stock';
            
            return (
              <tr key={part._id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <div className="font-semibold text-slate-200">{part.name}</div>
                    {part.description && (
                      <div className="text-sm text-slate-400 mt-1">{part.description}</div>
                    )}
                    <div className="text-xs text-slate-500 mt-1 font-mono">{part.partCode}</div>
                  </div>
                </td>
                
                <td className="px-4 py-3">
                  <div>
                    <div className="text-slate-300">{part.category}</div>
                    <div className="text-sm text-slate-400">{part.brand}</div>
                  </div>
                </td>
                
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-300">On Hand:</span>
                      <span className={`font-semibold ${isLowStock ? 'text-red-400' : 'text-green-400'}`}>
                        {onHand}
                      </span>
                    </div>
                    <div className="text-sm text-slate-400">
                      Reorder: {reorderLevel}
                    </div>
                    <div className="text-sm text-slate-400">
                      Reserved: {part.stock?.reserved || 0}
                    </div>
                  </div>
                </td>
                
                <td className="px-4 py-3">
                  <div>
                    <div className="font-semibold text-slate-200">
                      {formatCurrency(part.cost?.lastPurchasePrice, part.cost?.currency)}
                    </div>
                    <div className="text-sm text-slate-400">per {part.unit}</div>
                  </div>
                </td>
                
                <td className="px-4 py-3">
                  <StatusBadge 
                    status={stockStatus} 
                    type="stock" 
                    size="sm"
                  />
                </td>
                
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(part);
                      }}
                      className="btn-secondary text-xs px-3 py-1.5"
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    {part.isActive ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeactivate(part);
                        }}
                        className="btn-secondary text-xs px-3 py-1.5 text-red-400 hover:text-red-300"
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Deactivate
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onActivate(part);
                        }}
                        className="btn-secondary text-xs px-3 py-1.5 text-green-400 hover:text-green-300"
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Activate
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(part);
                      }}
                      className="btn-secondary text-xs px-3 py-1.5 text-red-500/80 hover:text-red-300"
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}