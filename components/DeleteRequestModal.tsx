'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface DeleteRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableName: string;
  recordId: string;
  entityId?: string;
  recordSnapshot: Record<string, any>;
}

export default function DeleteRequestModal({ isOpen, onClose, tableName, recordId, entityId, recordSnapshot }: DeleteRequestModalProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('Please provide a reason for deletion.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.error('You must be logged in.');
        return;
      }

      const { error } = await supabase.from('deletion_requests').insert({
        table_name: tableName,
        record_id: recordId,
        entity_id: entityId || null,
        record_snapshot: recordSnapshot,
        reason: reason.trim(),
        requested_by_id: session.user.id,
        requested_by_email: session.user.email,
        status: 'Pending',
      });

      if (error) {
        toast.error(`Failed to submit request: ${error.message}`);
      } else {
        toast.success('Deletion request submitted for approval.');
        setReason('');
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100 bg-white">
          <h3 className="text-lg font-bold text-gray-900">
            Request Deletion
          </h3>
          <button onClick={onClose} className="transition-colors duration-200 text-gray-400 hover:text-gray-900">✕</button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-gray-50">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800 font-medium">⚠️ This request will be reviewed by a Super Admin before the record is deleted.</p>
            <p className="text-xs text-amber-600 mt-1">Table: <strong>{tableName}</strong> · Record: <strong>{recordId}</strong></p>
          </div>

          <div>
            <label className="block text-[0.65rem] font-semibold uppercase mb-2 text-gray-500" style={{ letterSpacing: '0.08em' }}>
              Reason for Deletion <span className="text-red-400">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Explain why this record should be removed..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-gray-400 resize-none"
              required
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 flex justify-end space-x-3 bg-gray-50 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !reason.trim()}
            className="px-4 py-2 text-sm font-bold bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-30 transition-colors duration-200"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  );
}
