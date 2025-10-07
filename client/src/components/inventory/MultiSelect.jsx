import React, { useState } from 'react';

const MultiSelect = ({ 
  options = [], 
  selected = [], 
  onChange, 
  placeholder = 'Select items...', 
  displayKey = 'name',
  valueKey = '_id',
  maxHeight = '220px',
  error,
  touched
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasError = error && touched;

  const handleToggle = (value) => {
    const newSelected = selected.includes(value)
      ? selected.filter(item => item !== value)
      : [...selected, value];
    onChange(newSelected);
  };

  const handleSelectAll = () => {
    onChange(options.map(option => option[valueKey]));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const selectedItems = options.filter(option => selected.includes(option[valueKey]));

  return (
    <div className="relative">
      <div 
        className={`
          w-full px-4 py-3 rounded-xl border transition-all duration-200 cursor-pointer
          bg-surface/80 backdrop-blur-sm
          ${hasError 
            ? 'border-red-400 bg-red-50/5' 
            : 'border-white/10 hover:border-white/20'
          }
        `}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {selected.length === 0 ? (
              <span className="text-slate-500">{placeholder}</span>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedItems.slice(0, 3).map(item => (
                  <span 
                    key={item[valueKey]} 
                    className="chip-accent text-xs px-2 py-1"
                  >
                    {item[displayKey]}
                  </span>
                ))}
                {selected.length > 3 && (
                  <span className="text-slate-400 text-sm">
                    +{selected.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>
          <div className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
            <span className="text-slate-400">▼</span>
          </div>
        </div>
      </div>

      {isOpen && (
        <div 
          className="absolute top-full left-0 right-0 mt-2 bg-surface border border-white/10 rounded-xl shadow-lg z-50"
          style={{ maxHeight }}
        >
          <div className="p-3 border-b border-white/10 flex gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="btn-ghost text-xs px-3 py-1"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="btn-ghost text-xs px-3 py-1"
            >
              Clear All
            </button>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: '180px' }}>
            {options.map(option => {
              const isSelected = selected.includes(option[valueKey]);
              return (
                <label 
                  key={option[valueKey]} 
                  className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggle(option[valueKey])}
                    className="w-4 h-4 rounded border-white/20 bg-surface text-primary focus:ring-primary/30"
                  />
                  <span className="text-slate-200 text-sm">{option[displayKey]}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected items display */}
      {selected.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedItems.map(item => (
            <span 
              key={item[valueKey]} 
              className="chip-accent text-xs px-2 py-1 flex items-center gap-1"
            >
              {item[displayKey]}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggle(item[valueKey]);
                }}
                className="ml-1 text-xs hover:text-red-400 transition-colors"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultiSelect;