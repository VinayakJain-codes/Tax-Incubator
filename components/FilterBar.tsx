import React from 'react';

interface FilterBarProps {
  search: string;
  onSearch: (s: string) => void;
  filterOptions: Record<string, string[]>;
  activeFilters: Record<string, string>;
  onFilterChange: (key: string, val: string) => void;
}

export default function FilterBar({ search, onSearch, filterOptions, activeFilters, onFilterChange }: FilterBarProps) {
  return (
    <div
      className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 bg-white border-b border-gray-200"
    >
      
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

      {/* Dynamic Filter Dropdowns */}
      <div className="flex overflow-x-auto space-x-3 pb-1 sm:pb-0 hide-scrollbar">
        {Object.entries(filterOptions).map(([key, options]) => (
          options.length > 0 && (
            <select
              key={key}
              value={activeFilters[key] || ''}
              onChange={(e) => onFilterChange(key, e.target.value)}
              className="px-3 py-2 text-sm min-w-[120px] focus:outline-none bg-gray-50 text-gray-700 border border-gray-200 rounded-lg hover:border-gray-300 focus:border-gray-400 focus:bg-white transition-colors cursor-pointer"
            >
              <option value="">{key.replace(/_/g, ' ')} (All)</option>
              {options.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          )
        ))}
      </div>
      
    </div>
  );
}
