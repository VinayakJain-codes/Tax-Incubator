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

// ─── Auto-field calculation engine ───────────────────────────────────────────
function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function nextDueFromFrequency(lastFilingDate: string, frequency: string): Date | null {
  if (!lastFilingDate || !frequency) return null;
  const base = new Date(lastFilingDate);
  if (isNaN(base.getTime())) return null;

  switch (frequency) {
    case 'Monthly':     return addDays(base, 30);
    case 'Quarterly':   return addDays(base, 91);
    case 'Semi-Annual': return addDays(base, 182);
    case 'Annual':      return addDays(base, 365);
    default:            return null;
  }
}

function daysFromToday(date: Date | null): number | null {
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = date.getTime() - today.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

function ragFromDays(days: number | null): string {
  if (days === null) return '—';
  if (days < 0)  return '🔴 Overdue';
  if (days <= 14) return '🔴 Red';
  if (days <= 30) return '🟡 Amber';
  return '🟢 Green';
}

function reminderFlag(days: number | null): string {
  if (days === null) return '—';
  if (days <= 30) return '⚠️ Yes';
  return 'No';
}

function filingStatus(days: number | null): string {
  if (days === null) return '—';
  if (days < 0)   return 'Overdue';
  if (days <= 30) return 'Due Soon';
  return 'Filed';
}

function formatDate(date: Date | null): string {
  if (!date) return '—';
  return date.toISOString().split('T')[0];
}

function injectAutoFields(rows: any[], table: string): any[] {
  return rows.map(row => {
    const r = { ...row };

    // VAT Matrix auto fields
    if (table === 'vat_matrix') {
      const ndd = nextDueFromFrequency(r.last_filing_date, r.filing_frequency);
      const days = daysFromToday(ndd);
      r._next_due_date  = formatDate(ndd);
      r._days_to_due    = days !== null ? days : '—';
      r._filing_status  = filingStatus(days);
      r._reminder_flag  = reminderFlag(days);
    }

    // CT Matrix auto fields
    if (table === 'ct_matrix') {
      // Prefer return_due_date if set, else calculate from last_filing_date + frequency
      let ndd: Date | null = null;
      if (r.return_due_date) {
        ndd = new Date(r.return_due_date);
        if (isNaN(ndd.getTime())) ndd = null;
      }
      if (!ndd) ndd = nextDueFromFrequency(r.last_filing_date, r.filing_frequency);
      const days = daysFromToday(ndd);
      r._next_due_date  = formatDate(ndd);
      r._days_to_due    = days !== null ? days : '—';
      r._filing_status  = filingStatus(days);
      r._reminder_flag  = reminderFlag(days);
    }

    // Licenses auto fields
    if (table === 'licenses') {
      const expiry = r.expiry_date ? new Date(r.expiry_date) : null;
      const days = daysFromToday(expiry);
      r._days_to_expiry = days !== null ? days : '—';
    }

    // Renewal Calendar auto fields
    if (table === 'renewal_calendar') {
      const due = r.due_date ? new Date(r.due_date) : null;
      const days = daysFromToday(due);
      r._days_to_due   = days !== null ? days : '—';
      r._rag           = ragFromDays(days);
      r._reminder_flag = reminderFlag(days);
    }

    return r;
  });
}

// ─────────────────────────────────────────────────────────────────────────────

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
    else setData(injectAutoFields(records || [], config.table));
    setLoading(false);
  }

  const handleSaveEdit = async (newData: Record<string, any>) => {
    try {
      const pk = config.table === 'entities' ? 'entity_id' : 'id';
      const recordId = newData[pk];

      // Strip virtual _auto fields before saving to DB
      const dbData = Object.fromEntries(
        Object.entries(newData).filter(([k]) => !k.startsWith('_'))
      );

      await logEditChanges(config.table, recordId, editRow, dbData);

      const { error } = await (supabase.from(config.table) as any)
        .update(dbData)
        .eq(pk, recordId);

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
      // Strip virtual _auto fields before saving to DB
      const dbData = Object.fromEntries(
        Object.entries(newData).filter(([k]) => !k.startsWith('_'))
      );

      const { error } = await (supabase.from(config.table) as any).insert(dbData);
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
        initialData={
          config.table === 'entities'         ? { entity_id: 'E-' } :
          config.table === 'bank_accounts'    ? { bank_account_id: 'B-' } :
          config.table === 'ubo_register'     ? { ubo_id: 'U-' } :
          config.table === 'document_control' ? { doc_id: 'DOC-' } :
          config.table === 'controls_log'     ? { control_id: 'CTRL-' } :
          config.table === 'renewal_calendar' ? { } :
          config.table === 'auditors'         ? { auditor_code: 'AUD-' } :
          { entity_id: '' }
        }
        onSave={handleCreate}
      />

      {/* History Modal */}
      <RecordHistory
        isOpen={!!historyRow}
        onClose={() => setHistoryRow(null)}
        recordId={historyRow?.id || historyRow?.entity_id || null}
        title={`Audit Trail — ${historyRow?.[config.sortDefault] || 'Record'}`}
      />
    </div>
  );
}
