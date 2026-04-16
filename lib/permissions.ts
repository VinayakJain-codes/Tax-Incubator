import type { UserRole } from '@/types';

export const canEdit = (role: UserRole): boolean =>
  role === 'super_admin' || role === 'admin';

export const canDelete = (role: UserRole): boolean =>
  role === 'super_admin' || role === 'admin';

export const canApprove = (role: UserRole): boolean =>
  role === 'super_admin';

export const canManageUsers = (role: UserRole): boolean =>
  role === 'super_admin';

export const canViewAuditLog = (role: UserRole): boolean =>
  role === 'super_admin' || role === 'admin';

// Role display helpers
export const roleBadgeColor = (role: UserRole): string => {
  switch (role) {
    case 'super_admin': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'admin':       return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'viewer':      return 'bg-gray-100 text-gray-500 border-gray-200';
    default:            return 'bg-gray-100 text-gray-500 border-gray-200';
  }
};

export const roleLabel = (role: UserRole): string => {
  switch (role) {
    case 'super_admin': return 'Super Admin';
    case 'admin':       return 'Admin';
    case 'viewer':      return 'Viewer';
    default:            return 'Viewer';
  }
};
