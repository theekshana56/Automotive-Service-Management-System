import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function DashboardKPIs({ stats, className = '' }) {
  const navigate = useNavigate();

  const kpiData = [
    {
      title: 'Total Parts',
      value: stats.parts.toLocaleString(),
      subtitle: 'Inventory Items',
      icon: () => (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      color: 'blue',
      gradient: 'from-blue-500/20 via-blue-600/10 to-indigo-500/20',
      borderColor: 'border-blue-500/30',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-400',
      onClick: () => navigate('/parts')
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStock.toLocaleString(),
      subtitle: stats.lowStock > 0 ? 'Need Attention' : 'All Good',
      icon: () => (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
      color: stats.lowStock > 0 ? 'orange' : 'green',
      gradient: stats.lowStock > 0 ? 'from-orange-500/20 via-amber-600/10 to-yellow-500/20' : 'from-green-500/20 via-emerald-600/10 to-teal-500/20',
      borderColor: stats.lowStock > 0 ? 'border-orange-500/30' : 'border-green-500/30',
      iconBg: stats.lowStock > 0 ? 'bg-orange-500/10' : 'bg-green-500/10',
      iconColor: stats.lowStock > 0 ? 'text-orange-400' : 'text-green-400',
      trend: stats.lowStock > 0 ? 'down' : 'up',
      trendValue: stats.lowStock > 0 ? `${stats.lowStock} items` : 'All good',
      onClick: () => navigate('/low-stock')
    },
    {
      title: 'Active Suppliers',
      value: stats.suppliers.toLocaleString(),
      subtitle: 'Business Partners',
      icon: () => (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      color: 'purple',
      gradient: 'from-purple-500/20 via-violet-600/10 to-indigo-500/20',
      borderColor: 'border-purple-500/30',
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-400',
      onClick: () => navigate('/suppliers')
    },
    {
      title: 'PO Value',
      value: `$${stats.purchaseOrdersValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtitle: `${stats.poCount} Orders`,
      icon: () => (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'emerald',
      gradient: 'from-emerald-500/20 via-teal-600/10 to-cyan-500/20',
      borderColor: 'border-emerald-500/30',
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-400',
      trend: 'up',
      trendValue: `${stats.poCount} orders`,
      onClick: () => navigate('/purchase-orders')
    }
  ];

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 ${className}`}>
      {kpiData.map((kpi, index) => (
        <div
          key={index}
          className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${kpi.gradient} border ${kpi.borderColor} backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-${kpi.color}-500/20 cursor-pointer`}
          onClick={kpi.onClick}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
          </div>
          
          {/* Content */}
          <div className="relative p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${kpi.iconBg} ${kpi.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                {kpi.icon()}
              </div>
              {kpi.trend && (
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  kpi.trend === 'up' ? 'text-green-400' : 'text-red-400'
                }`}>
                  <svg className={`w-4 h-4 ${kpi.trend === 'up' ? 'rotate-0' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                  <span className="text-xs">{kpi.trendValue}</span>
                </div>
              )}
            </div>
            
            {/* Value */}
            <div className="mb-2">
              <div className="text-3xl font-bold text-white group-hover:text-white/90 transition-colors duration-300">
                {kpi.value}
              </div>
            </div>
            
            {/* Title and Subtitle */}
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-white group-hover:text-white/90 transition-colors duration-300">
                {kpi.title}
              </h3>
              <p className="text-sm text-slate-300 group-hover:text-slate-200 transition-colors duration-300">
                {kpi.subtitle}
              </p>
            </div>
            
            {/* Hover Indicator */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
        </div>
      ))}
    </div>
  );
}