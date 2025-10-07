import React from 'react';

const StatsCard = ({ 
  title, 
  value, 
  icon, 
  trend, 
  trendValue, 
  color = 'primary',
  className = '' 
}) => {
  const colorClasses = {
    primary: 'text-primary',
    success: 'text-green-400',
    warning: 'text-yellow-400',
    error: 'text-red-400',
    info: 'text-blue-400'
  };

  const trendClasses = {
    up: 'text-green-400',
    down: 'text-red-400',
    neutral: 'text-slate-400'
  };

  return (
    <div className={`card card-hover ${className}`}>
      <div className="card-body">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-slate-400 mb-1">{title}</p>
            <p className={`text-2xl font-bold ${colorClasses[color]}`}>
              {value}
            </p>
            {trend && trendValue && (
              <div className={`flex items-center gap-1 text-xs ${trendClasses[trend]}`}>
                <span>{trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}</span>
                <span>{trendValue}</span>
              </div>
            )}
          </div>
          {icon && (
            <div className={`text-2xl ${colorClasses[color]} opacity-80`}>
              {icon}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;