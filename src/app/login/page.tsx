'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function RedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get('role');
  const redirect = searchParams.get('redirect');

  useEffect(() => {
    const q = new URLSearchParams();
    if (role) q.set('role', role);
    if (redirect) q.set('redirect', redirect);
    router.replace(`/auth/login${q.toString() ? `?${q.toString()}` : ''}`);
  }, [router, role, redirect]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <p className="text-gray-500">A redirecionar...</p>
    </div>
  );
}

export default function LegacyLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><p className="text-gray-500">A carregar...</p></div>}>
      <RedirectContent />
    </Suspense>
  );
}
