import React from 'react';

export default function DashboardSidebar({ 
  lowStockParts = [], 
  onNavigate,
  className = '' 
}) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Low Stock Alert */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h3 className="card-title">Low Stock Alert</h3>
              <p className="card-subtitle">{lowStockParts.length} items need attention</p>
            </div>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
            {lowStockParts.length}
          </span>
        </div>
        
        <div className="card-body">
          {lowStockParts.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-slate-200 mb-2">All Good!</h4>
              <p className="text-slate-500 text-sm">All parts are well stocked</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                {lowStockParts.slice(0, 5).map(part => (
                  <div key={part._id} className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/15 transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-slate-200 text-sm truncate">{part.name}</div>
                      <div className="text-xs text-slate-500 mt-1 font-mono">{part.partCode}</div>
                      <div className="text-xs text-slate-400 mt-1">Category: {part.category || 'N/A'}</div>
                    </div>
                    <div className="text-right ml-3">
                      <div className="text-sm font-semibold text-red-400">{part.stock?.onHand || 0}</div>
                      <div className="text-xs text-slate-500">Min: {part.stock?.reorderLevel || 0}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => onNavigate('/low-stock')} 
                className="btn-secondary w-full text-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                View All Low Stock Items
              </button>
            </>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-accent/10">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="card-title">Quick Actions</h3>
              <p className="card-subtitle">Common tasks</p>
            </div>
          </div>
        </div>
        
        <div className="card-body space-y-3">
          <button 
            onClick={() => onNavigate('/parts/new')} 
            className="btn-primary w-full justify-start"
          >
            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Part
          </button>
          
          <button 
            onClick={() => onNavigate('/suppliers/new')} 
            className="btn-secondary w-full justify-start"
          >
            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Add Supplier
          </button>
          
          <button 
            onClick={() => onNavigate('/purchase-orders/new')} 
            className="btn-secondary w-full justify-start"
          >
            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Create Purchase Order
          </button>
          
          <button 
            onClick={() => onNavigate('/inventory/audit')} 
            className="btn-ghost w-full justify-start"
          >
            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            View Audit Logs
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-accent2/10">
              <svg className="w-5 h-5 text-accent2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="card-title">Recent Activity</h3>
              <p className="card-subtitle">Latest system events</p>
            </div>
          </div>
        </div>
        
        <div className="card-body space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-200">Part updated</div>
              <div className="text-xs text-slate-500 mt-1">Brake pad inventory adjusted</div>
              <div className="text-xs text-slate-600 mt-1">2 minutes ago</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-200">PO approved</div>
              <div className="text-xs text-slate-500 mt-1">Purchase order #PO-2024-001</div>
              <div className="text-xs text-slate-600 mt-1">1 hour ago</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-200">Low stock alert</div>
              <div className="text-xs text-slate-500 mt-1">Oil filter below minimum level</div>
              <div className="text-xs text-slate-600 mt-1">3 hours ago</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-200">Supplier added</div>
              <div className="text-xs text-slate-500 mt-1">New supplier: AutoParts Pro</div>
              <div className="text-xs text-slate-600 mt-1">5 hours ago</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}