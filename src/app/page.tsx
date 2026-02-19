/**
 * Tuma Taxi - Landing Page
 * Black Gold branding · Maputo · PT-PT
 */
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section - White/Clean Rider vibe */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-16 bg-gradient-to-b from-white to-gray-50">
        <h1 className="text-4xl md:text-5xl font-bold text-black text-center mb-4">
          Mova-se livremente em Moçambique.
        </h1>
        <p className="text-lg text-gray-600 text-center max-w-xl mb-12">
          Viagens fiáveis. Ganhos justos. Percursos seguros em Maputo e além.
        </p>

        {/* Primary Action Cards */}
        <div className="grid md:grid-cols-2 gap-6 w-full max-w-2xl">
          {/* Viajar com Tuma - Passenger (White/Clean) */}
          <Link
            href="/auth/login?role=passenger"
            className="group block p-8 rounded-2xl bg-white border-2 border-gray-200 hover:border-primary hover:shadow-xl transition-all duration-300"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/30 transition-colors">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8v8m-8-8h8" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-black mb-2">Viajar com Tuma</h2>
              <p className="text-gray-600 text-sm mb-4">Reserve em minutos. Carros limpos. Preços honestos.</p>
              <span className="text-primary font-semibold group-hover:underline">
                Entrar para viajar →
              </span>
            </div>
          </Link>

          {/* Conduzir com Tuma - Driver (Black/Dark) */}
          <Link
            href="/auth/login?role=driver"
            className="group block p-8 rounded-2xl bg-black hover:bg-gray-800 border-2 border-black hover:border-primary hover:shadow-xl transition-all duration-300"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/30 transition-colors">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Conduzir com Tuma</h2>
              <p className="text-gray-400 text-sm mb-4">Ganhe ao seu ritmo. Comissão justa. Pagamentos semanais.</p>
              <span className="text-primary font-semibold group-hover:underline">
                Entrar para conduzir →
              </span>
            </div>
          </Link>
        </div>

        {/* Sign up link */}
        <p className="mt-12 text-gray-600">
          Não tem conta?{' '}
          <Link href="/auth/signup" className="text-primary font-medium hover:underline">
            Registar
          </Link>
        </p>
      </section>

      {/* Footer — Pillar 5: Legal Shield links */}
      <footer className="py-6 text-center text-gray-500 text-sm border-t border-gray-200">
        <p className="mb-2">© Tuma Taxi · Moçambique</p>
        <p>
          <Link href="/privacy" className="text-primary/80 hover:underline mr-4">Privacidade</Link>
          <Link href="/terms" className="text-primary/80 hover:underline">Termos</Link>
        </p>
      </footer>
    </div>
  );
}
