'use client';

import { useRole } from '@/lib/useRole';
import type { UserRole } from '@/types';

interface PermissionGateProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function PermissionGate({ allowedRoles, children, fallback = null }: PermissionGateProps) {
  const { role, isLoading } = useRole();

  if (isLoading) return null;

  if (allowedRoles.includes(role)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
