'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRole } from '@/lib/useRole';
import { roleBadgeColor, roleLabel, canApprove } from '@/lib/permissions';

export default function TopBar() {
  const [userMeta, setUserMeta] = useState({ name: '', email: '', initials: '' });
  const { role, isLoading } = useRole();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const fullName = session.user.user_metadata?.full_name || '';
        const email = session.user.email || '';
        const nameParts = fullName ? fullName.split(' ') : email.split('@')[0].split('.');
        const initials = nameParts.length >= 2
          ? (nameParts[0][0] + nameParts[1][0]).toUpperCase()
          : nameParts[0].slice(0, 2).toUpperCase();
        setUserMeta({ name: fullName || email.split('@')[0], email, initials });
      }
    };
    getUser();
  }, []);

  // Fetch pending deletion requests count for Super Admins
  useEffect(() => {
    if (isLoading || !canApprove(role)) return;
    const fetchPending = async () => {
      const { count } = await supabase
        .from('deletion_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Pending');
      setPendingCount(count || 0);
    };
    fetchPending();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPending, 30000);
    return () => clearInterval(interval);
  }, [role, isLoading]);

  return (
    <header className="h-14 flex items-center justify-between px-6 shrink-0 z-10 bg-white border-b border-gray-200">
      {/* Left: Entity Filter */}
      <div>
        <select
          className="text-sm px-3 py-1.5 font-medium focus:outline-none cursor-pointer bg-gray-50 text-gray-900 border border-gray-200 rounded-md transition-colors duration-150 hover:border-gray-300"
        >
          <option>All Entities</option>
        </select>
      </div>

      {/* Right: Bell + User */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <a
          href={canApprove(role) && pendingCount > 0 ? '/approvals' : '#'}
          className="relative transition-colors duration-200 text-gray-500 hover:text-black"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {canApprove(role) && pendingCount > 0 ? (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full px-1">
              {pendingCount}
            </span>
          ) : (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" style={{ animation: 'pulse 2s infinite' }}></span>
          )}
        </a>

        {/* User Info */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold uppercase text-gray-900" style={{ letterSpacing: '0.08em' }}>
              {userMeta.name || 'User'}
            </p>
            {!isLoading && (
              <span className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${roleBadgeColor(role)}`} style={{ letterSpacing: '0.06em' }}>
                {roleLabel(role)}
              </span>
            )}
          </div>
          <div className="w-9 h-9 flex items-center justify-center text-sm font-black bg-gray-900 text-white rounded-md">
            {userMeta.initials || '?'}
          </div>
        </div>
      </div>
    </header>
  );
}
