'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { UserRole, UserProfile } from '@/types';

interface UseRoleReturn {
  role: UserRole;
  isLoading: boolean;
  profile: UserProfile | null;
}

let cachedProfile: UserProfile | null = null;
let cachePromise: Promise<UserProfile | null> | null = null;

async function fetchProfile(): Promise<UserProfile | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error || !data) return null;
  return data as UserProfile;
}

export function useRole(): UseRoleReturn {
  const [profile, setProfile] = useState<UserProfile | null>(cachedProfile);
  const [isLoading, setIsLoading] = useState(!cachedProfile);

  useEffect(() => {
    if (cachedProfile) {
      setProfile(cachedProfile);
      setIsLoading(false);
      return;
    }

    if (!cachePromise) {
      cachePromise = fetchProfile();
    }

    cachePromise.then((p) => {
      cachedProfile = p;
      setProfile(p);
      setIsLoading(false);
    });
  }, []);

  return {
    role: profile?.role ?? 'viewer',
    isLoading,
    profile,
  };
}

// Force refetch (e.g. after role change)
export function invalidateRoleCache() {
  cachedProfile = null;
  cachePromise = null;
}
