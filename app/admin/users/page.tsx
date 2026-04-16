'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import PermissionGate from '@/components/PermissionGate';
import { useRole, invalidateRoleCache } from '@/lib/useRole';
import { roleBadgeColor, roleLabel } from '@/lib/permissions';
import toast from 'react-hot-toast';
import type { UserRole, UserProfile } from '@/types';

const ROLE_OPTIONS: UserRole[] = ['viewer', 'admin', 'super_admin'];

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [confirmPromotion, setConfirmPromotion] = useState<{ userId: string; newRole: UserRole } | null>(null);
  const [resetPwdUser, setResetPwdUser] = useState<UserProfile | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resettingPwd, setResettingPwd] = useState(false);
  const { role: currentRole } = useRole();

  const loadUsers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: true });
    setUsers((data as UserProfile[]) || []);
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    // If promoting to super_admin, require confirmation
    if (newRole === 'super_admin') {
      setConfirmPromotion({ userId, newRole });
      return;
    }
    await applyRoleChange(userId, newRole);
  };

  const applyRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdating(userId);
    setConfirmPromotion(null);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) {
        toast.error(`Failed to update role: ${error.message}`);
        return;
      }

      // Log to audit trail
      const { data: { session } } = await supabase.auth.getSession();
      const targetUser = users.find(u => u.id === userId);
      await supabase.from('audit_log').insert({
        table_name: 'user_profiles',
        record_id: userId,
        field_name: 'role',
        old_value: targetUser?.role || 'unknown',
        new_value: newRole,
        action: 'UPDATE',
        changed_by_id: session?.user?.id,
        changed_by_email: session?.user?.email,
      });

      toast.success(`Role updated to ${roleLabel(newRole)}.`);
      invalidateRoleCache();
      loadUsers();
    } finally {
      setUpdating(null);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim() || !resetPwdUser) return;
    setResettingPwd(true);
    try {
      const { error } = await supabase.rpc('admin_reset_password', {
        target_user_id: resetPwdUser.id,
        new_password: newPassword
      });

      if (error) {
        toast.error(`Reset failed: ${error.message}`);
      } else {
        toast.success(`Password reset successfully for ${resetPwdUser.email}`);
        setResetPwdUser(null);
        setNewPassword('');
      }
    } finally {
      setResettingPwd(false);
    }
  };

  return (
    <PermissionGate
      allowedRoles={['super_admin']}
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-4xl mb-3">🔒</p>
            <p className="text-lg font-bold text-gray-900">Access Denied</p>
            <p className="text-sm text-gray-500 mt-1">Only Super Admins can manage users.</p>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">User Management</h2>
          <p className="text-gray-500 text-sm mt-1">Manage user roles and permissions across the platform.</p>
        </div>

        {/* Confirmation Dialog */}
        {confirmPromotion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4">
              <p className="text-lg font-bold text-gray-900 mb-2">⚠️ Confirm Super Admin Promotion</p>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to promote <strong>{users.find(u => u.id === confirmPromotion.userId)?.email}</strong> to Super Admin? They will have full control including user management and deletion approval.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmPromotion(null)}
                  className="flex-1 px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => applyRoleChange(confirmPromotion.userId, confirmPromotion.newRole)}
                  className="flex-1 px-4 py-2 text-sm font-bold bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition"
                >
                  Confirm Promote
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reset Password Dialog */}
        {resetPwdUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <form onSubmit={handleResetPassword} className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4">
              <p className="text-lg font-bold text-gray-900 mb-1">Reset Password</p>
              <p className="text-sm text-gray-500 mb-4">
                Set a new password for <strong className="text-gray-800">{resetPwdUser.email}</strong>
              </p>
              <div className="mb-4">
                <input
                  type="text"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="New password..."
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setResetPwdUser(null); setNewPassword(''); }}
                  className="flex-1 px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resettingPwd || !newPassword.trim()}
                  className="flex-1 px-4 py-2 text-sm font-bold bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition"
                >
                  {resettingPwd ? 'Saving...' : 'Save Password'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-[0.65rem] font-semibold uppercase text-gray-500" style={{ letterSpacing: '0.08em' }}>Email</th>
                <th className="px-6 py-3 text-[0.65rem] font-semibold uppercase text-gray-500" style={{ letterSpacing: '0.08em' }}>Name</th>
                <th className="px-6 py-3 text-[0.65rem] font-semibold uppercase text-gray-500" style={{ letterSpacing: '0.08em' }}>Role</th>
                <th className="px-6 py-3 text-[0.65rem] font-semibold uppercase text-gray-500" style={{ letterSpacing: '0.08em' }}>Joined</th>
                <th className="px-6 py-3 text-[0.65rem] font-semibold uppercase text-gray-500 text-right" style={{ letterSpacing: '0.08em' }}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [1, 2, 3].map(i => (
                  <tr key={i}>
                    <td className="px-6 py-4"><div className="h-4 w-40 bg-gray-200 rounded animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-200 rounded animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-28 bg-gray-200 rounded animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-10 bg-gray-200 rounded animate-pulse ml-auto" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No users found.</td></tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">{user.email}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{user.name || '—'}</td>
                    <td className="px-6 py-3">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                        disabled={updating === user.id}
                        className={`text-xs font-bold uppercase px-2 py-1 rounded-full border cursor-pointer ${roleBadgeColor(user.role)} disabled:opacity-50`}
                      >
                        {ROLE_OPTIONS.map(r => (
                          <option key={r} value={r}>{roleLabel(r)}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-400">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => setResetPwdUser(user)}
                        className="text-[0.65rem] font-bold uppercase tracking-wider px-3 py-1.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 hover:text-black transition"
                      >
                        Reset Pwd
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PermissionGate>
  );
}
