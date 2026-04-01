'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface RecordHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  recordId: string | null;
  title: string;
}

export default function RecordHistory({ isOpen, onClose, recordId, title }: RecordHistoryProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchHistory() {
      if (!isOpen || !recordId) return;
      setLoading(true);
      const { data } = await supabase
        .from('audit_log')
        .select('*')
        .eq('record_id', recordId)
        .order('changed_at', { ascending: false });
        
      setHistory(data || []);
      setLoading(false);
    }
    fetchHistory();
  }, [isOpen, recordId]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-white rounded-xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div
          className="px-6 py-4 flex justify-between items-center shrink-0 border-b border-gray-100 bg-white"
        >
          <div>
            <h3 className="text-lg font-bold text-gray-900 tracking-tight">Record History</h3>
            <p className="text-sm text-gray-500">{title}</p>
          </div>
          <button
            onClick={onClose}
            className="transition-colors duration-200 text-gray-400 hover:text-gray-900"
          >
            ✕
          </button>
        </div>

        {/* Timeline Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
          {loading ? (
            <div className="flex justify-center py-8">
              <div
                className="w-8 h-8 border-2 animate-spin border-gray-200 border-t-gray-900 rounded-full"
              ></div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No changes recorded yet.</div>
          ) : (
            <div className="space-y-6">
              {history.map((log) => (
                <div
                  key={log.id}
                  className="relative pl-6 border-l-2 border-gray-200"
                >
                  <div
                    className="absolute w-2.5 h-2.5 -left-[5.5px] top-1.5 bg-gray-400 rounded-full"
                  ></div>
                  
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{log.changed_by_email || 'System Action'}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(log.changed_at).toLocaleString('en-GB', { 
                        day: 'numeric', month: 'short', year: 'numeric', 
                        hour: '2-digit', minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  
                  <div className="text-sm p-3 mt-2 bg-white border border-gray-100 rounded-lg shadow-sm">
                    <div className="flex items-center space-x-2 mb-1">
                      <span
                        className="px-1.5 py-0.5 text-[10px] font-bold uppercase bg-gray-100 text-gray-500 rounded"
                        style={{ letterSpacing: '0.06em' }}
                      >
                        {log.action}
                      </span>
                      <span className="font-medium text-gray-900 capitalize">
                        {log.field_name.replace(/_/g, ' ')}
                      </span>
                    </div>
                    
                    {log.action === 'UPDATE' && (
                      <div className="flex flex-col sm:flex-row sm:items-center mt-2 text-xs font-mono">
                        <span
                          className="px-2 py-1 truncate flex-1 bg-gray-50 text-gray-500 rounded border border-gray-100"
                        >
                          {log.old_value || 'null'}
                        </span>
                        <span className="mx-2 py-1 sm:py-0 text-gray-400">→</span>
                        <span
                          className="px-2 py-1 truncate flex-1 bg-gray-100 text-gray-900 font-medium rounded border border-gray-200"
                        >
                          {log.new_value || 'null'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
