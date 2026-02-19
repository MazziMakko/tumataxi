'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { formatCurrencyMZN } from '@/lib/localization/mozambique';
import LogoutButton from '@/components/LogoutButton';

type PendingRide = {
  id: string;
  price: number;
  pickupAddress: string;
  dropoffAddress?: string;
  vehicleType?: string;
};

function safeFormatMZN(value: unknown): string {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : Number(value);
  return formatCurrencyMZN(Number.isFinite(n) ? n : 0);
}

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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);
  const [pendingRide, setPendingRide] = useState<PendingRide | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const mounted = useRef(true);
  const redirecting = useRef(false);
  const router = useRouter();

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data: authData } = await supabase.auth.getUser();
        const u = authData?.user ?? null;
        if (!u) {
          if (mounted.current) router.replace('/');
          return;
        }
        if (!mounted.current) return;
        setUser(u);
        setLoadError(null);

        const res = await fetch(`/api/driver/me?authId=${encodeURIComponent(u.id)}`);
        if (!mounted.current) return;

        if (!res.ok) {
          if (mounted.current && !redirecting.current) {
            redirecting.current = true;
            // 404 = no driver profile → onboarding; 401 = auth mismatch → home
            router.replace(res.status === 401 ? '/' : '/driver/onboarding');
          }
          return;
        }

        const data = await res.json().catch(() => null);
        if (!mounted.current) return;
        if (data == null || typeof data !== 'object') {
          setLoadError('Resposta inválida. Tente novamente.');
          return;
        }
        setProfile({
          userId: data.userId,
          verificationStatus: data.verificationStatus ?? 'PENDING',
          isOnline: Boolean(data.isOnline),
          todaysEarningsMZN: Number(data.todaysEarningsMZN) || 0,
          totalRidesCompleted: Number(data.totalRidesCompleted) || 0,
        });
      } catch (e) {
        if (mounted.current) {
          setLoadError('Erro ao carregar. Tente novamente.');
          console.error('Driver dashboard load error:', e);
        }
      } finally {
        if (mounted.current) setLoading(false);
      }
    })();
  }, [router]);

  // Supabase Realtime: listen for new REQUESTED rides (non-fatal; errors logged only)
  useEffect(() => {
    if (!profile?.isOnline || !user) return;
    let supabase: ReturnType<typeof createClient> | null = null;
    let ch: ReturnType<ReturnType<typeof createClient>['channel']> | null = null;
    try {
      supabase = createClient();
      ch = supabase
        .channel('ride-requests')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'Ride',
          },
          (payload: { new: Record<string, unknown> }) => {
            try {
              const row = (payload?.new ?? {}) as Record<string, unknown>;
              if (row.status === 'REQUESTED') {
                const price = typeof row.price === 'number' ? row.price : Number(row.finalFareMZN ?? row.baseFareMZN ?? 0);
                setPendingRide({
                  id: String(row.id ?? ''),
                  price: Number.isFinite(price) ? price : 0,
                  pickupAddress: String(row.pickupAddress ?? 'Maputo'),
                  dropoffAddress: row.dropoffAddress != null ? String(row.dropoffAddress) : undefined,
                  vehicleType: row.vehicleType != null ? String(row.vehicleType) : undefined,
                });
              }
            } catch (err) {
              console.warn('Realtime payload handler error:', err);
            }
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('Realtime subscription error (driver dashboard):', err);
    }
    return () => {
      if (supabase && ch) {
        try {
          supabase.removeChannel(ch);
        } catch {
          // ignore
        }
      }
    };
  }, [profile?.isOnline, user]);

  useEffect(() => {
    if (loading || loadError || profile || !user) return;
    if (redirecting.current) return;
    redirecting.current = true;
    router.replace('/driver/onboarding');
  }, [loading, user, profile, loadError, router]);

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
        const data = await res.json().catch(() => null);
        if (data != null && typeof data.isOnline === 'boolean') {
          setProfile((p) => (p ? { ...p, isOnline: data.isOnline } : null));
        }
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

  if (loadError) {
    return (
      <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center">
        <p className="text-red-400 mb-4">{loadError}</p>
        <button
          type="button"
          onClick={() => { setLoadError(null); setLoading(true); window.location.reload(); }}
          className="py-2 px-4 bg-primary text-black font-semibold rounded-lg"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!profile && user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-gray-400">A redirecionar...</p>
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
        <p className="text-gray-400 text-center max-w-sm mb-8">
          A equipa Tuma Taxi está a verificar os seus documentos. Será notificado quando for aprovado.
        </p>
        <p className="text-gray-500 text-xs text-center max-w-md">
          Para testes: defina <code className="bg-gray-800 px-1 rounded">NEXT_PUBLIC_DEV_AUTO_APPROVE=true</code> no .env.local e reinicie; ou no Supabase → DriverProfile → altere verificationStatus para APPROVED.
        </p>
        <div className="mt-6">
          <LogoutButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-24">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Painel do Motorista</h1>
          <LogoutButton />
        </div>

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
            <p className="text-2xl font-bold text-white mb-4">{safeFormatMZN(pendingRide.price)}</p>
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
              {safeFormatMZN(profile?.todaysEarningsMZN)}
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
