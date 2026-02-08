import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const role = user.user_metadata?.role ?? user.app_metadata?.role;
  if (role === 'DRIVER') {
    redirect('/driver/dashboard');
  }
  redirect('/ride/map');
}
