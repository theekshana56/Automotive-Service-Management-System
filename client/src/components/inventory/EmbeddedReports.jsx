import React from 'react';
import StatCard from '../ui/StatCard';

export default function EmbeddedReports({ 
  stockSummary, 
  supplierSpend, 
  onNavigate,
  className = '' 
}) {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${className}`}>
      {/* Stock Summary Report */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-accent2/10">
              <svg className="w-5 h-5 text-accent2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h3 className="card-title">Stock Summary</h3>
              <p className="card-subtitle">Current inventory overview</p>
            </div>
          </div>
          <button 
            className="btn-ghost text-sm"
            onClick={() => onNavigate('/reports/stock-summary')}
          >
            Open full report →
          </button>
        </div>
        
        <div className="card-body">
          {stockSummary.summary ? (
            <>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="text-xs uppercase tracking-wide text-slate-400 mb-1">Parts</div>
                  <div className="text-lg font-semibold text-slate-100">
                    {stockSummary.summary.totalParts.toLocaleString()}
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="text-xs uppercase tracking-wide text-slate-400 mb-1">On Hand</div>
                  <div className="text-lg font-semibold text-slate-100">
                    {stockSummary.summary.totalOnHand.toLocaleString()}
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="text-xs uppercase tracking-wide text-slate-400 mb-1">Available</div>
                  <div className="text-lg font-semibold text-accent">
                    {stockSummary.summary.totalAvailable.toLocaleString()}
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="text-xs uppercase tracking-wide text-slate-400 mb-1">Value</div>
                  <div className="text-lg font-semibold text-primary">
                    ${(stockSummary.summary.totalValuation || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {stockSummary.items.map((item, index) => (
                  <div key={item.partId || index} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-slate-200 text-sm truncate">
                        {item.partCode} — {item.name}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Category: {item.category || 'N/A'}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-right">
                        <div className="text-slate-300">Avail: <span className="font-medium text-accent">{item.available}</span></div>
                      </div>
                      <div className="text-right">
                        <div className="text-slate-300">Value: <span className="font-medium text-primary">${item.value?.toFixed?.(2) || '0.00'}</span></div>
                      </div>
                    </div>
                  </div>
                ))}
                {stockSummary.items.length === 0 && (
                  <div className="text-center py-6">
                    <div className="text-slate-500 text-sm">No stock data available</div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="text-slate-500 text-sm">Loading stock summary...</p>
            </div>
          )}
        </div>
      </div>

      {/* Supplier Spend Report */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h3 className="card-title">Supplier Spend</h3>
              <p className="card-subtitle">Top spending by supplier</p>
            </div>
          </div>
          <button 
            className="btn-ghost text-sm"
            onClick={() => onNavigate('/reports/supplier-spend')}
          >
            Open full report →
          </button>
        </div>
        
        <div className="card-body">
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {supplierSpend.map((row, index) => (
              <div key={row.supplierId || index} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xs font-medium text-primary">
                      {(row.companyName || 'Unknown').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-slate-200 text-sm truncate">
                      {row.companyName || 'Unknown Supplier'}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Avg Order: ${(row.avgOrderValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-right">
                    <div className="text-slate-300">Orders: <span className="font-medium text-accent">{row.totalOrders}</span></div>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-300">Spend: <span className="font-medium text-primary">${Number(row.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
                  </div>
                </div>
              </div>
            ))}
            {supplierSpend.length === 0 && (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-slate-500 text-sm">No supplier data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}