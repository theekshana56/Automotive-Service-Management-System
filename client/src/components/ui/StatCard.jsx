import React from 'react';

export default function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue, 
  color = 'primary',
  onClick 
}) {
  const colorClasses = {
    primary: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
    success: 'from-green-500/20 to-green-600/20 border-green-500/30',
    warning: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30',
    danger: 'from-red-500/20 to-red-600/20 border-red-500/30'
  };

  const iconColors = {
    primary: 'text-blue-400',
    success: 'text-green-400',
    warning: 'text-yellow-400',
    danger: 'text-red-400'
  };

  return (
    <div 
      className={`stat-card ${onClick ? 'cursor-pointer' : ''} bg-gradient-to-br ${colorClasses[color]} hover:scale-105 transition-all duration-300`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        {Icon && (
          <div className={`p-3 rounded-xl bg-white/5 ${iconColors[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
        {trend && (
          <div className={`flex items-center text-sm ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
            <span className="mr-1">{trend === 'up' ? '↗' : '↘'}</span>
            {trendValue}
          </div>
        )}
      </div>
      
      <div className="stat-card-value">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      
      <div className="stat-card-label">
        {title}
      </div>
    </div>
  );
}