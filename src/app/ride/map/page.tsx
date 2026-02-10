'use client';

import dynamic from 'next/dynamic';

/**
 * Ride map loads only on the client (ssr: false) so MapLibre/WebGL never runs on server.
 * Prevents SSR crash on /ride/map and on refresh.
 */
const RideMapClient = dynamic(() => import('@/components/RideMapClient'), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-100">
      <p className="text-gray-600">A carregar mapa...</p>
    </div>
  ),
});

export default function RideMapPage() {
  return <RideMapClient />;
}
