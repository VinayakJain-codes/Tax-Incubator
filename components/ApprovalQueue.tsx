'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRole } from '@/lib/useRole';
import { canApprove } from '@/lib/permissions';
import toast from 'react-hot-toast';

interface DeletionRequest {
  id: string;
  table_name: string;
  record_id: string;
  entity_id: string | null;
  reason: string;
  requested_by_email: string;
  requested_at: string;
  status: string;
  reviewed_by_email: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
}

export default function ApprovalQueue() {
  const { role } = useRole();
  const [requests, setRequests] = useState<DeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('deletion_requests')
      .select('*')
      .order('requested_at', { ascending: false });
    setRequests(data || []);
    setLoading(false);
  };

  useEffect(() => { loadRequests(); }, []);

  const handleAction = async (id: string, action: 'Approved' | 'Rejected') => {
    setProcessing(id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const email = session?.user?.email || 'unknown';

      // Update the deletion request status
      const { error: updateError } = await supabase
        .from('deletion_requests')
        .update({
          status: action,
          reviewed_by_email: email,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes[id] || null,
        })
        .eq('id', id);

      if (updateError) {
        toast.error(`Failed: ${updateError.message}`);
        return;
      }

      // If approved, soft-delete the record
      if (action === 'Approved') {
        const req = requests.find(r => r.id === id);
        if (req) {
          const { error: deleteError } = await supabase
            .from(req.table_name)
            .update({ is_deleted: true })
            .eq(req.table_name === 'entities' ? 'entity_id' : 'id', req.record_id);

          if (deleteError) {
            toast.error(`Record soft-delete failed: ${deleteError.message}`);
          }
        }
      }

      toast.success(`Request ${action.toLowerCase()}.`);
      loadRequests();
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const statusColor = (s: string) => {
    if (s === 'Approved') return 'bg-green-50 text-green-700 border-green-200';
    if (s === 'Rejected') return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-lg animate-pulse bg-gray-100" />)}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <span className="text-4xl block mb-2">✓</span>
          <p className="text-sm font-medium">No deletion requests found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusColor(req.status)}`}>
                      {req.status}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(req.requested_at)}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {req.table_name} · <span className="font-mono text-xs text-gray-500">{req.record_id}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">by {req.requested_by_email}</p>
                  <p className="text-sm text-gray-700 mt-2 bg-gray-50 px-3 py-2 rounded border border-gray-100">
                    "{req.reason}"
                  </p>
                  {req.review_notes && (
                    <p className="text-xs text-gray-500 mt-2 italic">
                      Review notes: {req.review_notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Action buttons — Super Admin only, Pending only */}
              {canApprove(role) && req.status === 'Pending' && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                  <input
                    type="text"
                    placeholder="Optional review notes..."
                    value={reviewNotes[req.id] || ''}
                    onChange={(e) => setReviewNotes(prev => ({ ...prev, [req.id]: e.target.value }))}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md bg-white focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(req.id, 'Approved')}
                      disabled={processing === req.id}
                      className="flex-1 px-3 py-1.5 text-xs font-bold bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleAction(req.id, 'Rejected')}
                      disabled={processing === req.id}
                      className="flex-1 px-3 py-1.5 text-xs font-bold bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 transition-colors"
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
