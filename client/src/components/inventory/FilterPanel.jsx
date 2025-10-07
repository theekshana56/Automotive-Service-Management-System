import React, { useState } from 'react';

export default function FilterPanel({ 
  filters = [], 
  onFilterChange, 
  dateRange = null,
  onDateRangeChange,
  onApplyFilters,
  onClearFilters,
  className = ''
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`card ${className}`}>
      <div className="card-body">
        {/* Filter Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-100">Filters</h3>
          </div>
          
          <button
            className="btn-ghost btn-icon"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <svg 
              className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Filter Content */}
        <div className={`transition-all duration-300 ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* Dropdown Filters */}
            {filters.map((filter, index) => (
              <div key={index}>
                <label className="label">{filter.label}</label>
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

            {/* Date Range */}
            {dateRange && (
              <>
                <div>
                  <label className="label">Start Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      className="input w-full pr-10"
                      value={dateRange.startDate}
                      onChange={(e) => onDateRangeChange({ ...dateRange, startDate: e.target.value })}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="label">End Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      className="input w-full pr-10"
                      value={dateRange.endDate}
                      onChange={(e) => onDateRangeChange({ ...dateRange, endDate: e.target.value })}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-white/10">
            <button className="btn-primary" onClick={onApplyFilters}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Apply Filters
            </button>
            
            <button className="btn-secondary" onClick={onClearFilters}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4l16 16m0-16L4 20" />
              </svg>
              Clear All
            </button>

            <button className="btn-ghost" onClick={() => setIsExpanded(false)}>
              Collapse
            </button>
          </div>
        </div>

        {/* Quick Filters (Always Visible) */}
        <div className="flex flex-wrap gap-2">
          {filters.slice(0, 2).map((filter, index) => (
            <div key={index} className="min-w-40">
              <select
                className="select w-full text-sm"
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
        </div>
      </div>
    </div>
  );
}