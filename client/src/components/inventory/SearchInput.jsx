import React from 'react';

const SearchInput = ({ 
  value, 
  onChange, 
  placeholder = "Search...", 
  className = "",
  onClear
}) => {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <span className="text-slate-400 text-sm">🔍</span>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input pl-10 pr-10"
      />
      {value && onClear && (
        <button
          onClick={onClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
        >
          <span className="text-sm">×</span>
        </button>
      )}
    </div>
  );
};

export default SearchInput;