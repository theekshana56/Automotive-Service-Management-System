import React from 'react';

const FormField = ({ 
  label, 
  name, 
  value, 
  onChange, 
  onBlur, 
  type = 'text', 
  placeholder, 
  required = false, 
  error, 
  touched, 
  helpText,
  children,
  className = '',
  ...props 
}) => {
  const hasError = error && touched;
  
  const inputClasses = `
    w-full px-4 py-3 rounded-xl border transition-all duration-200 ease-out
    text-slate-200 placeholder:text-slate-500 bg-surface/80 backdrop-blur-sm
    focus:outline-none focus:ring-2 focus:ring-primary/30
    ${hasError 
      ? 'border-red-400 bg-red-50/5 focus:border-red-400' 
      : 'border-white/10 hover:border-white/20 focus:border-primary/60'
    }
    ${className}
  `;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="block text-sm font-medium text-slate-300">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
        {helpText && (
          <div className="group relative">
            <div className="w-4 h-4 rounded-full bg-slate-600 text-slate-300 flex items-center justify-center text-xs cursor-help">
              i
            </div>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-slate-200 text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              {helpText}
            </div>
          </div>
        )}
      </div>
      
      {children || (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          className={inputClasses}
          {...props}
        />
      )}
      
      {hasError && (
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <span className="text-xs">⚠️</span>
          {error}
        </div>
      )}
    </div>
  );
};

export default FormField;