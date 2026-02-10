'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { formatCurrencyMZN } from '@/lib/localization/mozambique';

type PendingRide = {
  id: string;
  price: number;
  pickupAddress: string;
  dropoffAddress?: string;
  vehicleType?: string;
};

export default function DriverDashboardPage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<{
    userId?: string;
    verificationStatus: string;
    isOnline: boolean;
    todaysEarningsMZN: number;
    totalRidesCompleted: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [pendingRide, setPendingRide] = useState<PendingRide | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);
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

  // Supabase Realtime: listen for new REQUESTED rides (Rulial matching)
  useEffect(() => {
    if (!profile?.isOnline || !user) return;
    const supabase = createClient();
    // Table name in Postgres is lowercase when using Prisma default (no @@map)
    const channel = supabase
      .channel('ride-requests')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Ride',
        },
        (payload: { new: Record<string, unknown> }) => {
          const row = payload.new as Record<string, unknown>;
          if (row.status === 'REQUESTED') {
            const price = typeof row.price === 'number' ? row.price : Number(row.finalFareMZN ?? row.baseFareMZN ?? 0);
            setPendingRide({
              id: String(row.id),
              price,
              pickupAddress: String(row.pickupAddress ?? 'Maputo'),
              dropoffAddress: row.dropoffAddress != null ? String(row.dropoffAddress) : undefined,
              vehicleType: row.vehicleType != null ? String(row.vehicleType) : undefined,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.isOnline, user]);

  const handleAccept = useCallback(async () => {
    if (!pendingRide || !profile?.userId || accepting) return;
    setAccepting(true);
    try {
      const res = await fetch('/api/rides/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rideId: pendingRide.id,
          driverId: profile.userId,
          acceptedAt: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        setPendingRide(null);
      }
    } finally {
      setAccepting(false);
    }
  }, [pendingRide, profile?.userId, accepting]);

  const handleDecline = useCallback(async () => {
    if (!pendingRide || !profile?.userId || declining) return;
    setDeclining(true);
    try {
      await fetch('/api/rides/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rideId: pendingRide.id,
          driverId: profile.userId,
          reason: 'driver_declined',
          declinedAt: new Date().toISOString(),
        }),
      });
      setPendingRide(null);
    } finally {
      setDeclining(false);
    }
  }, [pendingRide, profile?.userId, declining]);

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
        setProfile((p) => (p ? { ...p, isOnline: data.isOnline } : null));
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

        {/* New Ride Request card — Rulial realtime matching */}
        {pendingRide && profile?.isOnline && (
          <div className="mb-6 p-6 bg-gray-900 rounded-2xl border-2 border-primary">
            <h2 className="text-lg font-bold text-primary mb-4">Nova viagem</h2>
            <p className="text-gray-400 text-sm mb-1">Preço</p>
            <p className="text-2xl font-bold text-white mb-4">{formatCurrencyMZN(pendingRide.price)}</p>
            <p className="text-gray-400 text-sm mb-1">Recolha</p>
            <p className="text-white mb-4">{pendingRide.pickupAddress}</p>
            {pendingRide.dropoffAddress && (
              <>
                <p className="text-gray-400 text-sm mb-1">Destino</p>
                <p className="text-white mb-4">{pendingRide.dropoffAddress}</p>
              </>
            )}
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleDecline}
                disabled={declining || accepting}
                className="flex-1 py-3 rounded-xl font-semibold bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50"
              >
                {declining ? '...' : 'Recusar'}
              </button>
              <button
                onClick={handleAccept}
                disabled={accepting || declining}
                className="flex-1 py-3 rounded-xl font-semibold bg-primary text-black hover:bg-primary-600 disabled:opacity-50"
              >
                {accepting ? 'A aceitar...' : 'Aceitar'}
              </button>
            </div>
          </div>
        )}

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
