'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [tableFilter, setTableFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50;

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    setLoading(true);
    const { data } = await supabase
      .from('audit_log')
      .select('*')
      .order('changed_at', { ascending: false });
      
    setLogs(data || []);
    setLoading(false);
  }

  // Derive unique lists for dropdowns
  const uniqueTables = Array.from(new Set(logs.map(l => l.table_name))).sort();
  const uniqueUsers = Array.from(new Set(logs.map(l => l.changed_by_email).filter(Boolean))).sort();

  // Apply filters client-side
  const filteredLogs = logs.filter(log => {
    if (tableFilter && log.table_name !== tableFilter) return false;
    if (userFilter && log.changed_by_email !== userFilter) return false;
    if (search) {
      const qs = search.toLowerCase();
      return (
        log.field_name.toLowerCase().includes(qs) ||
        (log.old_value && log.old_value.toLowerCase().includes(qs)) ||
        (log.new_value && log.new_value.toLowerCase().includes(qs))
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filteredLogs.length / rowsPerPage);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-GB', { 
      day: 'numeric', month: 'short', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Master Audit Log</h2>
        <p className="text-gray-500 text-sm mt-1">Immutable record of all changes across the application.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[75vh]">
        
        {/* Filter Bar specifically tailored for Audit Logs */}
        <div className="bg-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 shrink-0">
          <div className="flex space-x-3">
            <select 
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-orange-500"
              value={tableFilter} onChange={e => {setTableFilter(e.target.value); setCurrentPage(1);}}
            >
              <option value="">All Tables</option>
              {uniqueTables.map(t => <option key={String(t)} value={String(t)}>{String(t)}</option>)}
            </select>

            <select 
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-orange-500"
              value={userFilter} onChange={e => {setUserFilter(e.target.value); setCurrentPage(1);}}
            >
              <option value="">All Users</option>
              {uniqueUsers.map(u => <option key={String(u)} value={String(u)}>{String(u)}</option>)}
            </select>
          </div>
          
          <input 
            type="text"
            className="w-full sm:max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-orange-500"
            placeholder="Search fields or values..."
            value={search}
            onChange={e => {setSearch(e.target.value); setCurrentPage(1);}}
          />
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 sticky top-0 z-10 shadow-[0_1px_0_#e5e7eb]">
              <tr>
                <th className="px-6 py-3 font-medium">Timestamp</th>
                <th className="px-6 py-3 font-medium">User</th>
                <th className="px-6 py-3 font-medium">Module / Field</th>
                <th className="px-6 py-3 font-medium">Old Value</th>
                <th className="px-6 py-3 font-medium">New Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">Loading audit trail...</td></tr>
              ) : paginatedLogs.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">No logs found matching criteria.</td></tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-3 whitespace-nowrap text-gray-500">{formatDate(log.changed_at)}</td>
                    <td className="px-6 py-3 whitespace-nowrap font-medium text-slate-700">{log.changed_by_email || 'System'}</td>
                    <td className="px-6 py-3">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-2">{log.action}</span>
                        <span className="text-slate-900">{log.table_name}</span>
                      </div>
                      <div className="text-gray-500 text-xs mt-0.5">{log.field_name}</div>
                    </td>
                    <td className="px-6 py-3 font-mono text-xs text-red-600 max-w-[200px] truncate" title={log.old_value}>
                      {log.old_value !== null ? String(log.old_value) : <span className="text-gray-300 italic">null</span>}
                    </td>
                    <td className="px-6 py-3 font-mono text-xs text-green-600 max-w-[200px] truncate" title={log.new_value}>
                      {log.new_value !== null ? String(log.new_value) : <span className="text-gray-300 italic">null</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-between items-center shrink-0">
          <span className="text-sm text-gray-500">
            Showing <span className="font-medium">{filteredLogs.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}</span> to <span className="font-medium">{Math.min(currentPage * rowsPerPage, filteredLogs.length)}</span> of <span className="font-medium">{filteredLogs.length}</span> logs
          </span>
          <div className="flex space-x-2">
            <button 
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(p => p - 1)}
              className="px-3 py-1 bg-white border border-gray-300 rounded text-sm disabled:opacity-50"
            >
              Prev
            </button>
            <button 
              disabled={currentPage === totalPages || totalPages === 0} 
              onClick={() => setCurrentPage(p => p + 1)}
              className="px-3 py-1 bg-white border border-gray-300 rounded text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
