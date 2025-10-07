import React from 'react';
import NotificationBell from './NotificationBell';

export default function DashboardHeader({ 
  title = "Inventory Dashboard",
  description = "Monitor inventory, stock levels, purchase orders and suppliers",
  days,
  onDaysChange,
  autoRefresh,
  onAutoRefreshChange,
  onRefresh,
  loading = false
}) {
  return (
    <div className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-accent2/5 rounded-2xl"></div>
      
      <div className="relative p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Title Section */}
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-100 mb-2">
                {title}
              </h1>
              <p className="text-slate-400 text-sm md:text-base">
                {description}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            <NotificationBell />
            
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-xl p-2 border border-white/10">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <select 
                value={days} 
                onChange={e => onDaysChange(Number(e.target.value))} 
                className="bg-transparent text-slate-200 text-sm border-none outline-none cursor-pointer"
              >
                <option value={7} className="bg-surface text-slate-200">Last 7 days</option>
                <option value={30} className="bg-surface text-slate-200">Last 30 days</option>
                <option value={90} className="bg-surface text-slate-200">Last 90 days</option>
              </select>
            </div>

            <button 
              onClick={onRefresh} 
              disabled={loading}
              className="btn-secondary flex items-center gap-2"
            >
              <svg 
                className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>

            <label className="flex items-center gap-2 text-sm text-slate-300 bg-white/5 backdrop-blur-sm rounded-xl p-2 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
              <input 
                type="checkbox" 
                checked={autoRefresh} 
                onChange={e => onAutoRefreshChange(e.target.checked)}
                className="rounded border-white/20 bg-white/10 text-primary focus:ring-primary/50"
              />
              <span>Auto-refresh</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}