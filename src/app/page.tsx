/**
 * Tuma Taxi - Landing Page
 * High-conversion dual-sided marketplace entry
 */
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-16 bg-gradient-to-b from-white to-gray-50">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 text-center mb-4">
          Move Freely in Mozambique.
        </h1>
        <p className="text-lg text-gray-600 text-center max-w-xl mb-12">
          Reliable rides. Fair earnings. Safe journeys across Maputo and beyond.
        </p>

        {/* Primary Action Cards */}
        <div className="grid md:grid-cols-2 gap-6 w-full max-w-2xl">
          {/* Ride with Tuma - Passenger (White/Clean) */}
          <Link
            href="/auth/login?role=passenger"
            className="group block p-8 rounded-2xl bg-white border-2 border-gray-200 hover:border-blue-500 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8v8m-8-8h8" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Ride with Tuma</h2>
              <p className="text-gray-600 text-sm mb-4">Book a ride in minutes. Clean cars. Honest prices.</p>
              <span className="text-blue-600 font-semibold group-hover:underline">
                Log in to Ride →
              </span>
            </div>
          </Link>

          {/* Drive with Tuma - Driver (Dark/Bold) */}
          <Link
            href="/auth/login?role=driver"
            className="group block p-8 rounded-2xl bg-gray-900 hover:bg-gray-800 border-2 border-gray-800 hover:border-green-500 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4 group-hover:bg-green-500/30 transition-colors">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Drive with Tuma</h2>
              <p className="text-gray-400 text-sm mb-4">Earn on your schedule. Fair commission. Weekly payouts.</p>
              <span className="text-green-400 font-semibold group-hover:underline">
                Log in to Drive →
              </span>
            </div>
          </Link>
        </div>

        {/* Sign up link */}
        <p className="mt-12 text-gray-600">
          Não tem conta?{' '}
          <Link href="/auth/signup" className="text-blue-600 font-medium hover:underline">
            Registar
          </Link>
        </p>
      </section>

      {/* Footer */}
      <footer className="py-6 text-center text-gray-500 text-sm border-t border-gray-200">
        © Tuma Taxi · Mozambique
      </footer>
    </div>
  );
}
