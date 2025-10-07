import React from 'react';

export default function ReportHeader({ 
  title, 
  description, 
  stats = [], 
  actions = [],
  icon: Icon 
}) {
  return (
    <div className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-accent2/5 rounded-2xl"></div>
      
      <div className="relative p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Title Section */}
          <div className="flex items-center gap-4">
            {Icon && (
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                <Icon className="w-8 h-8 text-primary" />
              </div>
            )}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-100 mb-2">
                {title}
              </h1>
              <p className="text-slate-400 text-sm md:text-base">
                {description}
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          {stats.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 min-w-0 lg:min-w-96">
              {stats.map((stat, index) => (
                <div 
                  key={index}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all duration-200"
                >
                  <div className="text-xs uppercase tracking-wide text-slate-400 mb-1">
                    {stat.label}
                  </div>
                  <div className="text-lg font-semibold text-slate-100">
                    {stat.value}
                  </div>
                  {stat.change && (
                    <div className={`text-xs flex items-center gap-1 mt-1 ${
                      stat.change.startsWith('+') ? 'text-green-400' : 'text-red-400'
                    }`}>
                      <span>{stat.change.startsWith('+') ? '↗' : '↘'}</span>
                      {stat.change}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          {actions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {actions.map((action, index) => (
                <button
                  key={index}
                  className={action.variant === 'primary' ? 'btn-primary' : 'btn-secondary'}
                  onClick={action.onClick}
                  disabled={action.disabled}
                >
                  {action.icon && <action.icon className="w-4 h-4" />}
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}