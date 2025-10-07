import React from 'react';

const FilterBar = ({ 
  filters = [], 
  onFilterChange, 
  className = "",
  title = "Filters"
}) => {
  return (
    <div className={`card ${className}`}>
      <div className="card-header">
        <h3 className="card-title text-base">{title}</h3>
      </div>
      <div className="card-body">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filters.map((filter, index) => (
            <div key={index} className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">
                {filter.label}
              </label>
              {filter.type === 'select' ? (
                <select
                  value={filter.value}
                  onChange={(e) => onFilterChange(filter.key, e.target.value)}
                  className="select"
                >
                  <option value="">{filter.placeholder || `All ${filter.label}`}</option>
                  {filter.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : filter.type === 'date' ? (
                <input
                  type="date"
                  value={filter.value}
                  onChange={(e) => onFilterChange(filter.key, e.target.value)}
                  className="input"
                />
              ) : (
                <input
                  type="text"
                  placeholder={filter.placeholder}
                  value={filter.value}
                  onChange={(e) => onFilterChange(filter.key, e.target.value)}
                  className="input"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FilterBar;