'use client';

import { useState, useMemo } from 'react';
import FilterBar from './FilterBar';
import StatusBadge from './StatusBadge';
import type { SheetDef } from '../lib/sheet-config';
import { useRole } from '@/lib/useRole';
import { canEdit, canDelete } from '@/lib/permissions';

interface GenericTableProps {
  config: SheetDef;
  data: any[];
  isLoading: boolean;
  onEdit: (row: any) => void;
  onDelete: (row: any) => void;
  onRequestDelete?: (row: any) => void;
  onHistory: (row: any) => void;
  yearFilter?: number | null;
  onYearFilterChange?: (year: number | null) => void;
}

// Helper to determine if a row should be greyed out (lifecycle state)
function isRowFrozen(row: any, config: SheetDef): boolean {
  if (config.hasCompleted && row.is_completed) return true;
  if (row.is_resigned) return true;
  if (row.is_closed) return true;
  return false;
}

export default function GenericTable({ config, data = [], isLoading, onEdit, onDelete, onRequestDelete, onHistory, yearFilter, onYearFilterChange }: GenericTableProps) {
  const { role, isLoading: roleLoading } = useRole();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;

  // Generate year options for the year filter (current year ± 5)
  const yearOptions = useMemo(() => {
    if (!config.hasYearFilter) return [];
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear + 1; y >= currentYear - 5; y--) {
      years.push(y);
    }
    return years;
  }, [config.hasYearFilter]);

  const filterOptions = useMemo(() => {
    const opts: Record<string, string[]> = {};
    config.filters.forEach(key => {
      // 1. Check if the column has predefined options in the config
      const colDef = config.columns.find(c => c.key === key);
      if (colDef?.options) {
        opts[key] = colDef.options;
        return;
      }

      // 2. Special handling for boolean lifecycle fields
      const isBool = key === 'is_resigned' || key === 'is_closed' || key === 'is_completed' || colDef?.type === 'boolean';
      if (isBool) {
        opts[key] = ['true', 'false'];
        return;
      }

      // 3. Fallback to deriving from data for dynamic fields (like holding_company)
      const uniqueVals = new Set(data.map(d => d[key]).filter(v => v !== null && v !== undefined && v !== ''));
      opts[key] = Array.from(uniqueVals as Set<string>).sort();
    });
    return opts;
  }, [data, config.filters, config.columns]);

  const filteredData = useMemo(() => {
    return data.filter(row => {
      // Year filter for compliance tabs
      if (config.hasYearFilter && yearFilter) {
        // Try filtering by last_filing_date, expiry_date, return_due_date, or appointment_date
        const dateField = row.last_filing_date || row.expiry_date || row.return_due_date || row.appointment_date;
        if (dateField) {
          const rowYear = new Date(dateField).getFullYear();
          if (rowYear !== yearFilter) return false;
        } else if (row.audit_year && row.audit_year !== yearFilter) {
          return false;
        }
      }
      if (search) {
        const query = search.toLowerCase();
        // Only search visible columns defined in config
        const isMatch = config.columns.some(col => {
          const val = row[col.key];
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(query);
        });
        if (!isMatch) return false;
      }
      for (const [key, val] of Object.entries(filters)) {
        if (!val) continue;
        if (val === 'true' && !row[key]) return false;
        if (val === 'false' && row[key]) return false;
        if (val !== 'true' && val !== 'false' && row[key] !== val) return false;
      }
      return true;
    });
  }, [data, search, filters, yearFilter, config.hasYearFilter, config.columns]);

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
        yearFilter={yearFilter ?? null}
        onYearFilterChange={config.hasYearFilter ? onYearFilterChange : undefined}
        yearOptions={yearOptions}
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
              paginatedData.map((row, i) => {
                const frozen = isRowFrozen(row, config);
                return (
                  <tr
                    key={row.id || row.entity_id || i}
                    className={`transition-colors duration-150 cursor-default ${
                      frozen
                        ? 'bg-gray-100 opacity-60'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {config.columns.map(col => (
                      <td
                        key={col.key}
                        className={`px-6 py-3 whitespace-nowrap text-sm ${frozen ? 'text-gray-400' : 'text-gray-900'}`}
                      >
                        {col.key === 'is_resigned' || col.key === 'is_closed' || col.key === 'is_completed' ? (
                          <span className={row[col.key] ? 'text-amber-600 font-semibold' : 'text-gray-300'}>
                            {row[col.key] ? '● Yes' : '○ No'}
                          </span>
                        ) : col.type === 'status' || ['_filing_status', '_rag', '_reminder_flag'].includes(col.key) ? (
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
                        title="View Change History"
                      >
                        ◷
                      </button>
                      {!frozen && canEdit(role) && (
                        <button 
                          onClick={() => onEdit(row)}
                          className="transition-colors duration-200 px-3 py-1 rounded text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 hover:text-gray-900"
                          title="Edit Record"
                        >
                          Edit
                        </button>
                      )}
                      {config.table === 'entities' && !frozen && canEdit(role) && (
                        <a 
                          href={`/sheets/addresses?entity_id=${row.entity_id}`}
                          className="transition-colors duration-200 px-3 py-1 rounded text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-900 inline-block"
                          title="Add Address"
                        >
                          + Address
                        </a>
                      )}
                      {/* Super Admin: direct delete. Admin: request delete. Viewer: hidden */}
                      {!frozen && role === 'super_admin' && (
                        <button 
                          onClick={() => onDelete(row)}
                          className="transition-colors duration-200 px-2 py-1 rounded text-sm font-medium text-red-400 hover:text-red-600 hover:bg-red-50"
                          title="Delete Record"
                        >
                          ✕
                        </button>
                      )}
                      {!frozen && role === 'admin' && onRequestDelete && (
                        <button 
                          onClick={() => onRequestDelete(row)}
                          className="transition-colors duration-200 px-2 py-1 rounded text-sm font-medium text-amber-500 hover:text-amber-700 hover:bg-amber-50"
                          title="Request Deletion"
                        >
                          ⊘ Request
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
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
