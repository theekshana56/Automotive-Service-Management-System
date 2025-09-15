import React from 'react';
import StatusBadge from '../ui/StatusBadge';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function SupplierListTable({ 
  data, 
  onEdit, 
  onDeactivate, 
  onActivate,
  onDelete,
  loading = false 
}) {
  const items = data?.items || [];

  if (loading) {
    return (
      <div className="table-responsive">
        <LoadingSpinner size="lg" text="Loading suppliers..." />
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="table-responsive">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-6xl mb-4 opacity-50">🏢</div>
          <p className="text-slate-400 text-lg">No suppliers found</p>
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
            <th className="w-3/10">Supplier Details</th>
            <th className="w-1/4">Contact Info</th>
            <th className="w-1/6">Status</th>
            <th className="w-1/5">Notes</th>
            <th className="w-1/10">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((supplier) => (
            <tr key={supplier._id} className="hover:bg-white/5 transition-colors">
              <td className="px-4 py-3">
                <div>
                  <div className="font-semibold text-slate-200">{supplier.name}</div>
                  <div className="text-sm text-slate-400 mt-1">{supplier.email}</div>
                  {supplier.contactPerson && (
                    <div className="text-xs text-slate-500 mt-1">
                      Contact: {supplier.contactPerson}
                    </div>
                  )}
                </div>
              </td>
              
              <td className="px-4 py-3">
                <div className="space-y-1">
                  {supplier.phone && (
                    <div className="text-sm text-slate-300 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {supplier.phone}
                    </div>
                  )}
                  {supplier.address && (
                    <div className="text-xs text-slate-400 flex items-start gap-1">
                      <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="line-clamp-2">{supplier.address}</span>
                    </div>
                  )}
                </div>
              </td>
              
              <td className="px-4 py-3">
                <StatusBadge 
                  status={supplier.isActive} 
                  type="active" 
                  size="sm"
                />
              </td>
              
              <td className="px-4 py-3">
                <div className="text-sm text-slate-400 max-w-xs">
                  <span className="line-clamp-2">
                    {supplier.notes || 'No notes'}
                  </span>
                </div>
              </td>
              
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(supplier);
                    }}
                    className="btn-secondary text-xs px-3 py-1.5"
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                  {supplier.isActive ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeactivate(supplier);
                      }}
                      className="btn-secondary text-xs px-3 py-1.5 text-red-400 hover:text-red-300"
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                      </svg>
                      Deactivate
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onActivate(supplier);
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
                      onDelete(supplier);
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
          ))}
        </tbody>
      </table>
    </div>
  );
}