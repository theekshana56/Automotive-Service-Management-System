import React from 'react';

const PageHeader = ({ 
  title, 
  subtitle, 
  actions = [], 
  className = "",
  badge
}) => {
  return (
    <div className={`flex items-center justify-between mb-8 ${className}`}>
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="section-title">{title}</h1>
          {badge && badge}
        </div>
        {subtitle && (
          <p className="text-slate-400">{subtitle}</p>
        )}
      </div>
      
      {actions.length > 0 && (
        <div className="flex items-center gap-3">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              disabled={action.disabled}
              className={`
                ${action.variant === 'primary' ? 'btn-primary' : 'btn-secondary'}
                flex items-center gap-2
                ${action.className || ''}
              `}
            >
              {action.icon && <span>{action.icon}</span>}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PageHeader;