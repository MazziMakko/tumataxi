'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { assignRoleOnSignup } from '@/actions/auth';

type Role = 'DRIVER' | 'PASSENGER';

/** Normalize Supabase auth errors for user-friendly PT messages (Yango-style flow) */
function normalizeSignUpError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('rate limit') || m.includes('rate_limit') || m.includes('429') || m.includes('too many')) {
    return 'Muitas tentativas. Tente novamente em 5–10 minutos ou use Entrar se já tem conta.';
  }
  if (m.includes('already registered') || m.includes('already been registered') || m.includes('already exists')) {
    return 'Este email já está registado. Use Entrar para aceder à sua conta.';
  }
  return message;
}

function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<Role>('PASSENGER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const submittedRef = useRef(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role')?.toLowerCase();
  const isDriver = roleParam === 'driver' || role === 'DRIVER';

  useEffect(() => {
    if (roleParam === 'driver') setRole('DRIVER');
    else if (roleParam === 'passenger') setRole('PASSENGER');
  }, [roleParam]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submittedRef.current || loading) return;
    submittedRef.current = true;
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          role,
        },
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
      },
    });

    if (authError) {
      const msg = authError.message.toLowerCase();
      const isAlreadyRegistered = msg.includes('already registered') || msg.includes('already been registered') || msg.includes('already exists');
      if (isAlreadyRegistered) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (!signInError && signInData?.user) {
          const sync = await assignRoleOnSignup(signInData.user.id, email, firstName, lastName, role);
          if (sync.success) {
            const dest = role === 'DRIVER' ? '/driver/onboarding' : '/ride/map';
            router.push(dest);
            router.refresh();
            return;
          }
        }
      }
      setError(normalizeSignUpError(authError.message));
      setLoading(false);
      submittedRef.current = false;
      return;
    }
    if (!data.user) {
      setError('Registo falhou');
      setLoading(false);
      submittedRef.current = false;
      return;
    }

    const result = await assignRoleOnSignup(
      data.user.id,
      email,
      firstName,
      lastName,
      role
    );
    if (!result.success) {
      setError(result.error ?? 'Erro ao criar perfil');
      setLoading(false);
      submittedRef.current = false;
      return;
    }

    if (!data.session) {
      setAwaitingConfirmation(true);
      setLoading(false);
      setPassword('');
      submittedRef.current = false;
      return;
    }

    const destination = role === 'DRIVER' ? '/driver/onboarding' : '/ride/map';
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
        <p className={`mb-8 ${isDriver ? 'text-gray-400' : 'text-gray-600'}`}>Criar conta</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setRole('PASSENGER')}
              className={`flex-1 py-3 rounded-lg font-medium ${
                role === 'PASSENGER'
                  ? isDriver
                    ? 'bg-primary text-black'
                    : 'bg-primary text-black'
                  : isDriver
                    ? 'bg-gray-800 text-gray-400'
                    : 'bg-gray-100 text-gray-600'
              }`}
            >
              Passageiro
            </button>
            <button
              type="button"
              onClick={() => setRole('DRIVER')}
              className={`flex-1 py-3 rounded-lg font-medium ${
                role === 'DRIVER'
                  ? isDriver
                    ? 'bg-primary text-black'
                    : 'bg-primary text-black'
                  : isDriver
                    ? 'bg-gray-800 text-gray-400'
                    : 'bg-gray-100 text-gray-600'
              }`}
            >
              Motorista
            </button>
          </div>
          <input
            type="text"
            placeholder="Nome"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-primary ${
              isDriver ? 'bg-gray-800 border border-gray-700 text-white' : 'border border-gray-300'
            }`}
            required
          />
          <input
            type="text"
            placeholder="Apelido"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-primary ${
              isDriver ? 'bg-gray-800 border border-gray-700 text-white' : 'border border-gray-300'
            }`}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-primary ${
              isDriver ? 'bg-gray-800 border border-gray-700 text-white' : 'border border-gray-300'
            }`}
            required
          />
          <input
            type="password"
            placeholder="Senha (mín. 6 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-primary ${
              isDriver ? 'bg-gray-800 border border-gray-700 text-white' : 'border border-gray-300'
            }`}
            required
            minLength={6}
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {awaitingConfirmation && (
            <p className={`text-sm p-3 rounded-lg ${isDriver ? 'text-green-400 bg-green-900/30' : 'text-green-600 bg-green-50'}`}>
              Verifique o seu email para confirmar a conta.
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 font-bold rounded-lg disabled:opacity-50 bg-primary text-black hover:bg-primary-600"
          >
            {loading ? 'A registar...' : 'Registar'}
          </button>
        </form>
        <p className={`mt-6 text-center ${isDriver ? 'text-gray-400' : 'text-gray-600'}`}>
          Já tem conta?{' '}
          <Link
            href={`/auth/login${roleParam ? `?role=${roleParam}` : ''}`}
            className="text-primary font-medium hover:underline"
          >
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <p className="text-gray-500">A carregar...</p>
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
