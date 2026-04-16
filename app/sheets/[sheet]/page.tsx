'use client';

import { useEffect, useState } from 'react';
import { logEditChanges } from '@/lib/audit';
import { supabase } from '@/lib/supabase';
import { SHEET_CONFIG, type SheetDef } from '@/lib/sheet-config';
import GenericTable from '@/components/GenericTable';
import EditModal from '@/components/EditModal';
import RecordHistory from '@/components/RecordHistory';
import DeleteRequestModal from '@/components/DeleteRequestModal';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useRole } from '@/lib/useRole';
import { canEdit } from '@/lib/permissions';
import { 
  getNextDueDate,
  getPeriodEndDate,
  daysFromToday, 
  getFilingStatus, 
  getFilingReminderFlag,
  getLicenseStatus,
  getLicenseReminderFlag,
  getRAG,
  getCalendarReminderFlag 
} from '@/lib/formulas';

function injectAutoFields(rows: any[], table: string): any[] {
  return rows.map(row => {
    const r = { ...row };

    // VAT Matrix auto fields
    if (table === 'vat_matrix') {
      let ndd: Date | null = null;
      if (r.next_due_date) {
        ndd = new Date(r.next_due_date);
        if (isNaN(ndd.getTime())) ndd = null;
      }
      if (!ndd) ndd = getNextDueDate(r.last_filing_date, r.filing_frequency);
      const days = daysFromToday(ndd);
      r._next_due_date  = ndd ? ndd.toISOString().split('T')[0] : '—';
      r._days_to_due    = days !== null ? days : '—';
      const status = getFilingStatus(ndd);
      r._filing_status  = status;
      r._reminder_flag  = getFilingReminderFlag(status) || '';
    }

    // CT Matrix auto fields
    if (table === 'ct_matrix') {
      let ndd: Date | null = null;
      if (r.return_due_date) {
        ndd = new Date(r.return_due_date);
        if (isNaN(ndd.getTime())) ndd = null;
      }
      if (!ndd) ndd = getNextDueDate(r.last_filing_date, r.filing_frequency);
      const days = daysFromToday(ndd);
      r._next_due_date  = ndd ? ndd.toISOString().split('T')[0] : '—';
      r._days_to_due    = days !== null ? days : '—';
      const status = getFilingStatus(ndd);
      r._filing_status  = status;
      r._reminder_flag  = getFilingReminderFlag(status) || '';
    }

    // Licenses auto fields
    if (table === 'licenses') {
      const days = daysFromToday(r.expiry_date);
      r._days_to_expiry = days !== null ? days : '—';
      const status = getLicenseStatus(r.expiry_date);
      r._filing_status  = status || '—';
      r._reminder_flag  = getLicenseReminderFlag(status) || '';
    }

    // Renewal Calendar auto fields
    if (table === 'renewal_calendar') {
      const days = daysFromToday(r.due_date);
      r._days_to_due   = days !== null ? days : '—';
      const rag = getRAG(r.due_date);
      r._rag           = rag || '—';
      r._reminder_flag = getCalendarReminderFlag(rag) || '';
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
  const [yearFilter, setYearFilter] = useState<number | null>(null);
  // Delete confirmation state
  const [deleteRow, setDeleteRow] = useState<any | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  // RBAC: Admin-level deletion request modal
  const [requestDeleteRow, setRequestDeleteRow] = useState<any | null>(null);
  const { role, isLoading: roleLoading } = useRole();
  const searchParams = useSearchParams();
  const presetEntityId = searchParams.get('entity_id');

  useEffect(() => {
    if (!config) return;
    loadData();
    if (presetEntityId) {
      setShowNew(true);
    }
  }, [params.sheet, presetEntityId]);

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
      
      // Auto-Renewal Rollover Logic
      if (
        ['vat_matrix', 'ct_matrix', 'licenses'].includes(config.table) &&
        !editRow?.is_completed &&
        dbData.is_completed
      ) {
        const rolloverData = { ...dbData };
        delete rolloverData[pk]; // Remove primary key so a new one is generated
        
        if (config.table === 'vat_matrix' || config.table === 'ct_matrix') {
          // Use period-end date (WITHOUT grace) as the base for next cycle
          const periodEnd = getPeriodEndDate(dbData.last_filing_date, dbData.filing_frequency);
          if (periodEnd) rolloverData.last_filing_date = periodEnd.toISOString().split('T')[0];
          
          if (config.table === 'ct_matrix' && dbData.return_due_date) {
            const rrdd = getPeriodEndDate(dbData.return_due_date, dbData.filing_frequency);
            if (rrdd) rolloverData.return_due_date = rrdd.toISOString().split('T')[0];
          }
          
          if (config.table === 'vat_matrix' && dbData.next_due_date) {
            const ndd = getPeriodEndDate(dbData.next_due_date, dbData.filing_frequency);
            if (ndd) rolloverData.next_due_date = ndd.toISOString().split('T')[0];
          }
        } else if (config.table === 'licenses' && dbData.expiry_date) {
          // Defaults to 1-year renewal for licenses
          const newExp = new Date(dbData.expiry_date);
          newExp.setFullYear(newExp.getFullYear() + 1);
          rolloverData.expiry_date = newExp.toISOString().split('T')[0];
        }
        
        rolloverData.is_completed = false;
        
        const { error: insErr } = await (supabase.from(config.table) as any).insert(rolloverData);
        if (!insErr) {
          setTimeout(() => toast.success('Next cycle automatically generated', { icon: '🔄' }), 500);
        } else {
          console.error("Rollover Error:", insErr);
        }
      }

      toast.success('Record updated');
      setEditRow(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Error updating record');
    }
  };

  const handleCreate = async (newData: Record<string, any>) => {
    try {
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

  // ── Delete with reason + manager approval ──
  const handleDeleteRequest = async () => {
    if (!deleteReason.trim()) {
      toast.error('Please provide a reason for deletion.');
      return;
    }
    setIsDeleting(true);
    try {
      const pk = config.table === 'entities' ? 'entity_id' : 'id';
      const recordId = deleteRow[pk];

      // Get current user info
      const { data: { user } } = await supabase.auth.getUser();

      // Record the deletion request (soft pending approval)
      const { error: reqErr } = await supabase.from('deletion_requests').insert({
        table_name: config.table,
        record_id: String(recordId),
        entity_id: deleteRow.entity_id || null,
        record_snapshot: deleteRow,
        reason: deleteReason.trim(),
        requested_by_id: user?.id || null,
        requested_by_email: user?.email || null,
        status: 'Pending',
      });

      if (reqErr) throw reqErr;

      // Soft-delete the record immediately (Manager can restore from deletion_requests)
      const { error: delErr } = await (supabase.from(config.table) as any)
        .update({ is_deleted: true })
        .eq(pk, recordId);

      if (delErr) throw delErr;

      toast.success('Record removed. Deletion request sent for Manager review.');
      setDeleteRow(null);
      setDeleteReason('');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Error requesting deletion');
    }
    setIsDeleting(false);
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
        {canEdit(role) && (
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-gray-900 hover:bg-black rounded-md transition-all duration-200"
          >
            <span className="text-base">+</span>
            Add {config.label.split(' ')[0]}
          </button>
        )}
      </div>

      <GenericTable
        config={config}
        data={data}
        isLoading={loading}
        onEdit={(row) => setEditRow(row)}
        onDelete={(row) => { setDeleteRow(row); setDeleteReason(''); }}
        onRequestDelete={(row) => setRequestDeleteRow(row)}
        onHistory={(row) => setHistoryRow(row)}
        yearFilter={yearFilter}
        onYearFilterChange={setYearFilter}
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
          config.table === 'shareholders'     ? { shareholder_id: 'SH-' } :
          config.table === 'document_control' ? { doc_id: 'DOC-' } :
          config.table === 'controls_log'     ? { control_id: 'CTRL-' } :
          config.table === 'renewal_calendar' ? { } :
          config.table === 'auditors'         ? { auditor_code: 'AUD-' } :
          { entity_id: presetEntityId || '' }
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

      {/* Delete Confirmation Modal */}
      {deleteRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <span className="text-2xl">🗑️</span>
              <div>
                <h3 className="text-base font-bold text-gray-900">{role === 'super_admin' ? 'Confirm Deletion' : 'Request Deletion'}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{role === 'super_admin' ? 'This will permanently soft-delete the record.' : 'This will be sent to a Manager for approval.'}</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 border border-gray-200">
                <span className="font-semibold">Record: </span>
                {deleteRow[config.sortDefault] || deleteRow.entity_id || deleteRow.id}
              </div>
              <div>
                <label className="block text-[0.65rem] font-semibold uppercase text-gray-500 mb-2" style={{ letterSpacing: '0.08em' }}>
                  Reason for Deletion <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={deleteReason}
                  onChange={e => setDeleteReason(e.target.value)}
                  placeholder="Explain why this record needs to be deleted..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 bg-white resize-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 flex justify-end gap-3 bg-gray-50 border-t border-gray-100">
              <button
                onClick={() => { setDeleteRow(null); setDeleteReason(''); }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRequest}
                disabled={!deleteReason.trim() || isDeleting}
                className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-40 transition-colors"
              >
                {isDeleting ? 'Submitting...' : role === 'super_admin' ? 'Delete Record' : 'Submit for Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin-level Delete Request Modal */}
      <DeleteRequestModal
        isOpen={!!requestDeleteRow}
        onClose={() => setRequestDeleteRow(null)}
        tableName={config.table}
        recordId={requestDeleteRow ? String(requestDeleteRow[config.table === 'entities' ? 'entity_id' : 'id']) : ''}
        entityId={requestDeleteRow?.entity_id}
        recordSnapshot={requestDeleteRow || {}}
      />
    </div>
  );
}
