'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function RedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get('role');

  useEffect(() => {
    const q = role ? `?role=${role}` : '';
    router.replace(`/auth/signup${q}`);
  }, [router, role]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <p className="text-gray-500">A redirecionar...</p>
    </div>
  );
}

export default function LegacySignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><p className="text-gray-500">A carregar...</p></div>}>
      <RedirectContent />
    </Suspense>
  );
}
