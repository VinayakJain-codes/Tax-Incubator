'use client';

import { useState, useMemo } from 'react';
import FilterBar from './FilterBar';
import StatusBadge from './StatusBadge';
import type { SheetDef } from '../lib/sheet-config';

interface GenericTableProps {
  config: SheetDef;
  data: any[];
  isLoading: boolean;
  onEdit: (row: any) => void;
  onHistory: (row: any) => void;
}

export default function GenericTable({ config, data = [], isLoading, onEdit, onHistory }: GenericTableProps) {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;

  const filterOptions = useMemo(() => {
    const opts: Record<string, string[]> = {};
    config.filters.forEach(key => {
      const uniqueVals = new Set(data.map(d => d[key]).filter(Boolean));
      opts[key] = Array.from(uniqueVals).sort();
    });
    return opts;
  }, [data, config.filters]);

  const filteredData = useMemo(() => {
    return data.filter(row => {
      if (search) {
        const rowString = Object.values(row).join(' ').toLowerCase();
        if (!rowString.includes(search.toLowerCase())) return false;
      }
      for (const [key, val] of Object.entries(filters)) {
        if (val && row[key] !== val) return false;
      }
      return true;
    });
  }, [data, search, filters]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handleFilterChange = (key: string, val: string) => {
    setFilters(prev => ({ ...prev, [key]: val }));
    setCurrentPage(1);
  };

  return (
    <div className="overflow-hidden flex flex-col h-[75vh] bg-white border border-gray-200 rounded-lg shadow-sm">
      
      <FilterBar 
        search={search} onSearch={(s) => { setSearch(s); setCurrentPage(1); }}
        filterOptions={filterOptions}
        activeFilters={filters}
        onFilterChange={handleFilterChange}
      />

      <div className="flex-1 overflow-auto relative">
        <table className="min-w-full text-sm text-left">
          <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
            <tr>
              {config.columns.map(col => (
                <th
                  key={col.key}
                  className="px-6 py-3 whitespace-nowrap text-[0.65rem] font-semibold uppercase text-gray-500"
                  style={{ letterSpacing: '0.08em' }}
                >
                  {col.label}
                </th>
              ))}
              <th
                className="px-6 py-3 text-right text-[0.65rem] font-semibold uppercase text-gray-500"
                style={{ letterSpacing: '0.08em' }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="text-gray-900 divide-y divide-gray-100">
            {isLoading ? (
              [1, 2, 3, 4, 5].map(i => (
                <tr key={i}>
                  {config.columns.map(col => (
                    <td key={col.key} className="px-6 py-4">
                      <div className="h-4 rounded animate-pulse w-24 bg-gray-200"></div>
                    </td>
                  ))}
                  <td className="px-6 py-4">
                    <div className="h-4 rounded animate-pulse w-8 ml-auto bg-gray-200"></div>
                  </td>
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={config.columns.length + 1} className="px-6 py-8 text-center text-gray-500">
                  No records found matching criteria.
                </td>
              </tr>
            ) : (
              paginatedData.map((row, i) => (
                <tr
                  key={row.id || row.entity_id || i}
                  className="transition-colors duration-150 cursor-default hover:bg-gray-50"
                >
                  {config.columns.map(col => (
                    <td key={col.key} className="px-6 py-3 whitespace-nowrap text-sm">
                      {col.type === 'status' ? (
                        <StatusBadge status={row[col.key]} />
                      ) : col.type === 'boolean' ? (
                        <span className={row[col.key] ? 'text-gray-900' : 'text-gray-400'}>
                          {row[col.key] ? '● Yes' : '○ No'}
                        </span>
                      ) : (
                        row[col.key] || <span className="text-gray-300">—</span>
                      )}
                    </td>
                  ))}
                  <td className="px-6 py-3 text-right whitespace-nowrap space-x-3">
                    <button 
                      onClick={() => onHistory(row)}
                      className="transition-colors duration-200 text-gray-400 hover:text-gray-900"
                      title="View History"
                    >
                      ◷
                    </button>
                    <button 
                      onClick={() => onEdit(row)}
                      className="transition-colors duration-200 px-3 py-1 rounded text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 hover:text-gray-900"
                      title="Edit Record"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-3 flex items-center justify-between shrink-0 bg-gray-50 border-t border-gray-200">
        <span className="text-sm text-gray-500">
          Showing <span className="font-medium text-gray-900">{filteredData.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}</span> to <span className="font-medium text-gray-900">{Math.min(currentPage * rowsPerPage, filteredData.length)}</span> of <span className="font-medium text-gray-900">{filteredData.length}</span> results
        </span>
        <div className="flex space-x-2">
          <button 
            disabled={currentPage === 1} 
            onClick={() => setCurrentPage(p => p - 1)}
            className="px-3 py-1 text-sm font-medium rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 transition-colors duration-200"
          >
            ← Prev
          </button>
          <button 
            disabled={currentPage === totalPages || totalPages === 0} 
            onClick={() => setCurrentPage(p => p + 1)}
            className="px-3 py-1 text-sm font-medium rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 transition-colors duration-200"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
