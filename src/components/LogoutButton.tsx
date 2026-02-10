'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * Yango-style logout: sign out and redirect to home.
 * variant dark = driver (black bg), light = rider (map/light bg).
 */
export default function LogoutButton({ variant = 'dark' }: { variant?: 'dark' | 'light' }) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  const className =
    variant === 'light'
      ? 'text-sm font-medium text-gray-700 hover:text-black transition-colors'
      : 'text-sm font-medium text-gray-400 hover:text-white transition-colors';

  return (
    <button type="button" onClick={handleLogout} className={className}>
      Sair
    </button>
  );
}
