'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { formatCurrencyMZN } from '@/lib/localization/mozambique';

export default function DriverDashboardPage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<{
    verificationStatus: string;
    isOnline: boolean;
    todaysEarningsMZN: number;
    totalRidesCompleted: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) {
        router.push('/');
        return;
      }
      setUser(u);

      const res = await fetch(`/api/driver/me?authId=${u.id}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      } else {
        router.push('/driver/onboarding');
      }
      setLoading(false);
    })();
  }, [router]);

  async function toggleOnline() {
    if (!user || toggling) return;
    setToggling(true);
    try {
      const res = await fetch('/api/driver/go-online', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authId: user.id,
          isOnline: !profile?.isOnline,
          lat: -25.9692,
          lng: 32.5732,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setProfile((p) => p ? { ...p, isOnline: data.isOnline } : null);
      }
    } finally {
      setToggling(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-gray-400">A carregar...</p>
      </div>
    );
  }

  if (profile?.verificationStatus === 'PENDING') {
    return (
      <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 0 11 18 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">A aguardar aprovação</h1>
        <p className="text-gray-400 text-center max-w-sm">
          A equipa Tuma Taxi está a verificar os seus documentos. Será notificado quando for aprovado.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-24">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-8">Painel do Motorista</h1>

        <button
          onClick={toggleOnline}
          disabled={toggling || profile?.verificationStatus !== 'APPROVED'}
          className={`w-full py-6 rounded-2xl font-bold text-xl mb-8 transition ${
            profile?.isOnline
              ? 'bg-red-600 hover:bg-red-500 text-white'
              : 'bg-primary text-black hover:bg-primary-600'
          } disabled:opacity-50`}
        >
          {profile?.isOnline ? 'PARAR - Ir Offline' : 'IR ONLINE'}
        </button>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-900 rounded-2xl p-6">
            <p className="text-gray-400 text-sm mb-1">Hoje</p>
            <p className="text-2xl font-bold text-primary">
              {formatCurrencyMZN(profile?.todaysEarningsMZN ?? 0)}
            </p>
          </div>
          <div className="bg-gray-900 rounded-2xl p-6">
            <p className="text-gray-400 text-sm mb-1">Viagens</p>
            <p className="text-2xl font-bold text-white">
              {profile?.totalRidesCompleted ?? 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
