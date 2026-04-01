'use client';

import { useEffect, useState } from 'react';
import { logEditChanges } from '@/lib/audit';
import { supabase } from '@/lib/supabase';
import { SHEET_CONFIG, type SheetDef } from '@/lib/sheet-config';
import GenericTable from '@/components/GenericTable';
import EditModal from '@/components/EditModal';
import RecordHistory from '@/components/RecordHistory';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function SheetPage({ params }: { params: { sheet: string } }) {
  const config = SHEET_CONFIG[params.sheet];

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editRow, setEditRow] = useState<any | null>(null);
  const [historyRow, setHistoryRow] = useState<any | null>(null);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    if (!config) return;
    loadData();
  }, [params.sheet]);

  async function loadData() {
    setLoading(true);
    const { data: records, error } = await supabase
      .from(config.table)
      .select('*')
      .eq('is_deleted', false)
      .order(config.sortDefault, { ascending: true, nullsFirst: false });

    if (error) toast.error('Failed to load records');
    else setData(records || []);
    setLoading(false);
  }

  const handleSaveEdit = async (newData: Record<string, any>) => {
    try {
      await logEditChanges(config.table, newData.id, editRow, newData);

      const { error } = await (supabase.from(config.table) as any)
        .update(newData)
        .eq('id', newData.id);

      if (error) throw error;
      toast.success('Record updated');
      setEditRow(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Error updating record');
    }
  };

  const handleCreate = async (newData: Record<string, any>) => {
    try {
      const { error } = await (supabase.from(config.table) as any).insert(newData);
      if (error) throw error;
      toast.success('Record created');
      setShowNew(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Error creating record');
    }
  };

  if (!config) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Sheet Not Found</h2>
          <p className="mt-2 text-gray-500">The requested sheet does not exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard" className="hover:text-gray-900 transition-colors duration-200">Home</Link>
        <span className="text-gray-400">›</span>
        <span className="text-gray-900 font-medium">{config.label}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">{config.label}</h2>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-gray-900 hover:bg-black rounded-md transition-all duration-200"
        >
          <span className="text-base">+</span>
          Add {config.label.split(' ')[0]}
        </button>
      </div>

      <GenericTable
        config={config}
        data={data}
        isLoading={loading}
        onEdit={(row) => setEditRow(row)}
        onHistory={(row) => setHistoryRow(row)}
      />

      {/* Edit Modal */}
      <EditModal
        isOpen={!!editRow}
        onClose={() => setEditRow(null)}
        config={config}
        initialData={editRow || {}}
        onSave={handleSaveEdit}
      />

      {/* Create Modal */}
      <EditModal
        isOpen={showNew}
        onClose={() => setShowNew(false)}
        config={config}
        initialData={{}}
        onSave={handleCreate}
      />

      {/* History Modal */}
      <RecordHistory
        isOpen={!!historyRow}
        onClose={() => setHistoryRow(null)}
        recordId={historyRow?.id || null}
        title={`Audit Trail — ${historyRow?.[config.sortDefault] || 'Record'}`}
      />
    </div>
  );
}
