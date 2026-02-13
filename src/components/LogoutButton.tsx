'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * Yango-style logout: sign out and redirect to home.
 * variant dark = driver (black bg), light = rider (map/light bg).
 */
export default function LogoutButton({ variant = 'dark' }: { variant?: 'dark' | 'light' }) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/');
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  }

  const className =
    variant === 'light'
      ? 'text-sm font-medium text-gray-700 hover:text-black transition-colors disabled:opacity-60'
      : 'text-sm font-medium text-gray-400 hover:text-white transition-colors disabled:opacity-60';

  return (
    <button type="button" onClick={handleLogout} disabled={loggingOut} className={className}>
      {loggingOut ? 'A sair...' : 'Sair'}
    </button>
  );
}
