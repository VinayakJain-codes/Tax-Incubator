import React, { useState } from 'react';

interface FilterBarProps {
  search: string;
  onSearch: (s: string) => void;
  filterOptions: Record<string, string[]>;
  activeFilters: Record<string, string>;
  onFilterChange: (key: string, val: string) => void;
  yearFilter?: number | null;
  onYearFilterChange?: (year: number | null) => void;
  yearOptions?: number[];
}

export default function FilterBar({
  search, onSearch, filterOptions, activeFilters, onFilterChange,
  yearFilter, onYearFilterChange, yearOptions = [],
}: FilterBarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeCount = Object.values(activeFilters).filter(Boolean).length + (yearFilter ? 1 : 0);

  // Label formatter for filter keys
  const fmtKey = (k: string) => k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="px-6 py-4 flex flex-col gap-3 shrink-0 bg-white border-b border-gray-200">
      {/* Top row: Search + Filter Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Search Bar */}
        <div className="relative w-full sm:max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400">⌕</span>
          </div>
          <input 
            type="text"
            className="block w-full pl-9 pr-3 py-2 text-sm focus:outline-none bg-gray-50 text-gray-900 border border-gray-200 rounded-lg hover:border-gray-300 focus:border-gray-400 focus:bg-white transition-colors"
            placeholder="Search all columns..."
            value={search}
            onChange={e => onSearch(e.target.value)}
          />
        </div>

        {/* Filter Toggle Button */}
        <button
          onClick={() => setFiltersOpen(o => !o)}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors duration-200 ${
            activeCount > 0
              ? 'bg-gray-900 text-white border-gray-900 hover:bg-gray-700'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          <span>⊟ Filters</span>
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-white text-gray-900">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* Collapsible Filter Panel */}
      {filtersOpen && (
        <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100 animate-in fade-in slide-in-from-top-1 duration-100">
          
          {/* Year Filter (only for compliance tabs) */}
          {onYearFilterChange && yearOptions.length > 0 && (
            <div className="flex flex-col gap-1">
              <label className="text-[0.6rem] font-semibold uppercase text-gray-500 tracking-widest">Year</label>
              <select
                value={yearFilter ?? ''}
                onChange={e => onYearFilterChange(e.target.value ? Number(e.target.value) : null)}
                className="px-3 py-1.5 text-sm min-w-[110px] focus:outline-none bg-gray-50 text-gray-700 border border-gray-200 rounded-lg hover:border-gray-300 focus:border-gray-400 focus:bg-white transition-colors cursor-pointer"
              >
                <option value="">All Years</option>
                {yearOptions.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}

          {/* Dynamic Column Filters */}
          {Object.entries(filterOptions).map(([key, options]) =>
            options.length > 0 ? (
              <div key={key} className="flex flex-col gap-1">
                <label className="text-[0.6rem] font-semibold uppercase text-gray-500 tracking-widest">
                  {fmtKey(key)}
                </label>
                <select
                  value={activeFilters[key] || ''}
                  onChange={e => onFilterChange(key, e.target.value)}
                  className="px-3 py-1.5 text-sm min-w-[120px] focus:outline-none bg-gray-50 text-gray-700 border border-gray-200 rounded-lg hover:border-gray-300 focus:border-gray-400 focus:bg-white transition-colors cursor-pointer"
                >
                  <option value="">All {fmtKey(key)}</option>
                  {options.map(opt => (
                    <option key={opt} value={opt}>{opt === 'true' ? 'Yes' : opt === 'false' ? 'No' : opt}</option>
                  ))}
                </select>
              </div>
            ) : null
          )}

          {/* Clear All */}
          {activeCount > 0 && (
            <div className="flex flex-col justify-end">
              <button
                onClick={() => {
                  Object.keys(activeFilters).forEach(k => onFilterChange(k, ''));
                  if (onYearFilterChange) onYearFilterChange(null);
                }}
                className="px-3 py-1.5 text-sm font-medium text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
