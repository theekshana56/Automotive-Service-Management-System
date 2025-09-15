import React from 'react';

export default function SearchFilterBar({ 
  searchValue, 
  onSearchChange, 
  searchPlaceholder = 'Search...', 
  filters = [], 
  onFilterChange,
  actions = [],
  className = ''
}) {
  return (
    <div className={`search-filter-bar ${className}`}>
      {/* Search Input */}
      <div className="flex-1 min-w-64">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            className="input pl-10 w-full"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Filters */}
      {filters.map((filter, index) => (
        <div key={index} className="min-w-40">
          <select
            className="select w-full"
            value={filter.value}
            onChange={(e) => onFilterChange(filter.key, e.target.value)}
          >
            <option value="">{filter.placeholder || `All ${filter.label}`}</option>
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ))}

      {/* Action Buttons */}
      {actions.length > 0 && (
        <div className="flex gap-2">
          {actions.map((action, index) => (
            <button
              key={index}
              className={action.className || 'btn-primary'}
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
  );
}