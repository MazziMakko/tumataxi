'use client';

import { useState, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { loginAndRedirect } from '@/actions/auth';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role')?.toLowerCase(); // passenger | driver
  const isDriver = roleParam === 'driver';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }
    if (!data.user) {
      setError('Login failed');
      setLoading(false);
      return;
    }
    const destination = await loginAndRedirect(data.user.id);
    router.push(destination);
    router.refresh();
  }

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center px-4 ${
        isDriver ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
      }`}
    >
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-2">Tuma Taxi</h1>
        <p className={`mb-8 ${isDriver ? 'text-gray-400' : 'text-gray-600'}`}>
          {isDriver ? 'Log in to Drive' : 'Log in to Ride'}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              isDriver
                ? 'bg-gray-800 border border-gray-700 text-white placeholder-gray-500'
                : 'border border-gray-300'
            }`}
            required
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              isDriver
                ? 'bg-gray-800 border border-gray-700 text-white placeholder-gray-500'
                : 'border border-gray-300'
            }`}
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 font-semibold rounded-lg disabled:opacity-50 ${
              isDriver
                ? 'bg-green-600 hover:bg-green-500 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? 'A entrar...' : 'Entrar'}
          </button>
        </form>
        <p className={`mt-6 text-center ${isDriver ? 'text-gray-400' : 'text-gray-600'}`}>
          Não tem conta?{' '}
          <Link
            href={`/auth/signup${roleParam ? `?role=${roleParam}` : ''}`}
            className="text-blue-500 font-medium hover:underline"
          >
            Registar
          </Link>
        </p>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <p className="text-gray-500">A carregar...</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
