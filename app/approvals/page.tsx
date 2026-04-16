'use client';

import PermissionGate from '@/components/PermissionGate';
import ApprovalQueue from '@/components/ApprovalQueue';

export default function ApprovalsPage() {
  return (
    <PermissionGate
      allowedRoles={['super_admin', 'admin']}
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-4xl mb-3">🔒</p>
            <p className="text-lg font-bold text-gray-900">Access Denied</p>
            <p className="text-sm text-gray-500 mt-1">You don't have permission to view this page.</p>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Deletion Approvals</h2>
          <p className="text-gray-500 text-sm mt-1">Review and manage pending deletion requests.</p>
        </div>
        <ApprovalQueue />
      </div>
    </PermissionGate>
  );
}
