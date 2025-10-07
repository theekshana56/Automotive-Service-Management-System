import React, { useState, useRef, useEffect } from 'react';

const ActionMenu = ({ 
  actions = [], 
  trigger = "⋮", 
  className = "",
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (disabled || actions.length === 0) {
    return null;
  }

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-ghost btn-icon text-slate-400 hover:text-slate-200"
      >
        {trigger}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-white/10 rounded-xl shadow-lg z-50">
          <div className="py-2">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  action.onClick();
                  setIsOpen(false);
                }}
                disabled={action.disabled}
                className={`
                  w-full text-left px-4 py-2 text-sm transition-colors
                  ${action.disabled 
                    ? 'text-slate-500 cursor-not-allowed' 
                    : action.destructive 
                      ? 'text-red-400 hover:bg-red-500/10' 
                      : 'text-slate-200 hover:bg-white/10'
                  }
                  flex items-center gap-3
                `}
              >
                {action.icon && <span>{action.icon}</span>}
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionMenu;