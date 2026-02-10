'use client';

import { useState, useRef, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { loginAndRedirect } from '@/actions/auth';

function normalizeLoginError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('rate limit') || m.includes('429') || m.includes('too many')) {
    return 'Muitas tentativas. Tente novamente em alguns minutos.';
  }
  if (m.includes('invalid') && m.includes('credentials')) {
    return 'Email ou senha incorretos. Tente novamente.';
  }
  return message;
}

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const submittedRef = useRef(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role')?.toLowerCase(); // passenger | driver
  const isDriver = roleParam === 'driver';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submittedRef.current || loading) return;
    submittedRef.current = true;
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(normalizeLoginError(authError.message));
      setLoading(false);
      submittedRef.current = false;
      return;
    }
    if (!data.user) {
      setError('Falha ao entrar');
      setLoading(false);
      submittedRef.current = false;
      return;
    }
    const { destination, role } = await loginAndRedirect(data.user.id);
    if (role && !data.user.user_metadata?.role) {
      await supabase.auth.updateUser({ data: { role } });
    }
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
          {isDriver ? 'Entrar para conduzir' : 'Entrar para viajar'}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
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
            className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
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
            className={`w-full py-3 font-bold rounded-lg disabled:opacity-50 ${
              isDriver
                ? 'bg-primary text-black hover:bg-primary-600'
                : 'bg-primary text-black hover:bg-primary-600'
            }`}
          >
            {loading ? 'A entrar...' : 'Entrar'}
          </button>
        </form>
        <p className={`mt-6 text-center ${isDriver ? 'text-gray-400' : 'text-gray-600'}`}>
          Não tem conta?{' '}
          <Link
            href={`/auth/signup${roleParam ? `?role=${roleParam}` : ''}`}
            className="text-primary font-medium hover:underline"
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
