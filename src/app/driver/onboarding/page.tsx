'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const STEPS = [
  { id: 1, title: 'Informação Pessoal' },
  { id: 2, title: 'Dados do Veículo' },
  { id: 3, title: 'Documentos' },
];

export default function DriverOnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submittedRef = useRef(false);
  const [form, setForm] = useState({
    // Step 1
    firstName: '',
    lastName: '',
    phone: '',
    // Step 2
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    licensePlate: '',
    vehicleColor: '',
    vehicleType: 'TAXI' as const,
    // Step 3
    licenseFront: null as File | null,
    licenseBack: null as File | null,
    insurance: null as File | null,
    registration: null as File | null,
  });

  const router = useRouter();
  const supabase = createClient();

  /** Upload a document; returns empty string on failure so onboarding can still succeed without storage */
  async function uploadDoc(file: File, path: string): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from('driver-docs')
        .upload(path, file, { upsert: true });
      if (error) return '';
      const { data: urlData } = supabase.storage.from('driver-docs').getPublicUrl(data.path);
      return urlData.publicUrl ?? '';
    } catch {
      return '';
    }
  }

  async function handleSubmit() {
    if (submittedRef.current || loading) return;
    submittedRef.current = true;
    setLoading(true);
    setSubmitError(null);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user ?? null;
      if (!user) {
        setSubmitError('Sessão inválida. Faça login novamente.');
        return;
      }
      if (!user.email?.trim()) {
        setSubmitError('Conta sem email. Use uma conta com email válido.');
        return;
      }

      let licenseFrontUrl = '';
      let licenseBackUrl = '';
      let insuranceUrl = '';
      let vehicleRegistrationUrl = '';

      if (form.licenseFront) {
        licenseFrontUrl = await uploadDoc(form.licenseFront, `${user.id}/license-front`);
      }
      if (form.licenseBack) {
        licenseBackUrl = await uploadDoc(form.licenseBack, `${user.id}/license-back`);
      }
      if (form.insurance) {
        insuranceUrl = await uploadDoc(form.insurance, `${user.id}/insurance`);
      }
      if (form.registration) {
        vehicleRegistrationUrl = await uploadDoc(form.registration, `${user.id}/registration`);
      }

      const res = await fetch('/api/driver/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authId: user.id,
          email: user.email ?? '',
          firstName: form.firstName?.trim() || '',
          lastName: form.lastName?.trim() || '',
          phone: form.phone?.trim() || undefined,
          vehicleMake: form.vehicleMake,
          vehicleModel: form.vehicleModel,
          vehicleYear: parseInt(form.vehicleYear) || 2020,
          licensePlate: form.licensePlate,
          vehicleColor: form.vehicleColor,
          vehicleType: form.vehicleType,
          licenseFrontUrl,
          licenseBackUrl,
          insuranceUrl,
          vehicleRegistrationUrl,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(typeof data?.error === 'string' ? data.error : 'Erro ao submeter. Tente novamente.');
        return;
      }
      if (data && typeof (data as { success?: boolean }).success === 'boolean' && !(data as { success: boolean }).success) {
        setSubmitError(typeof (data as { error?: string }).error === 'string' ? (data as { error: string }).error : 'Erro ao submeter.');
        return;
      }
      router.push('/driver/dashboard');
      router.refresh();
    } catch (err) {
      console.error(err);
      setSubmitError('Erro ao submeter. Tente novamente.');
    } finally {
      setLoading(false);
      submittedRef.current = false;
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-2">Registo de Motorista</h1>
        <p className="text-gray-400 mb-8">Complete os 3 passos para começar</p>

        <div className="flex gap-2 mb-10">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={`flex-1 h-2 rounded ${
                step >= s.id ? 'bg-green-500' : 'bg-gray-700'
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <input
              placeholder="Nome"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              className="w-full px-4 py-4 bg-gray-900 border border-gray-700 rounded-xl text-lg"
            />
            <input
              placeholder="Apelido"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              className="w-full px-4 py-4 bg-gray-900 border border-gray-700 rounded-xl text-lg"
            />
            <input
              placeholder="Telemóvel (+258)"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-4 py-4 bg-gray-900 border border-gray-700 rounded-xl text-lg"
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <input
              placeholder="Marca (ex: Toyota)"
              value={form.vehicleMake}
              onChange={(e) => setForm({ ...form, vehicleMake: e.target.value })}
              className="w-full px-4 py-4 bg-gray-900 border border-gray-700 rounded-xl text-lg"
            />
            <input
              placeholder="Modelo (ex: Corolla)"
              value={form.vehicleModel}
              onChange={(e) => setForm({ ...form, vehicleModel: e.target.value })}
              className="w-full px-4 py-4 bg-gray-900 border border-gray-700 rounded-xl text-lg"
            />
            <input
              placeholder="Ano"
              value={form.vehicleYear}
              onChange={(e) => setForm({ ...form, vehicleYear: e.target.value })}
              className="w-full px-4 py-4 bg-gray-900 border border-gray-700 rounded-xl text-lg"
            />
            <input
              placeholder="Matrícula"
              value={form.licensePlate}
              onChange={(e) => setForm({ ...form, licensePlate: e.target.value })}
              className="w-full px-4 py-4 bg-gray-900 border border-gray-700 rounded-xl text-lg"
            />
            <input
              placeholder="Cor"
              value={form.vehicleColor}
              onChange={(e) => setForm({ ...form, vehicleColor: e.target.value })}
              className="w-full px-4 py-4 bg-gray-900 border border-gray-700 rounded-xl text-lg"
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-gray-500 text-sm mb-2">Clique em cada campo ou em &quot;Escolher ficheiro&quot; para enviar documentos (opcional).</p>
            <label className="block" htmlFor="license-front">
              <span className="text-gray-400 block mb-1">Carta de Condução (Frente)</span>
              <input
                id="license-front"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setForm({ ...form, licenseFront: e.target.files?.[0] ?? null })}
                className="w-full px-4 py-4 bg-gray-900 border border-gray-700 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary file:text-black file:font-medium"
              />
            </label>
            <label className="block" htmlFor="license-back">
              <span className="text-gray-400 block mb-1">Carta de Condução (Costas)</span>
              <input
                id="license-back"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setForm({ ...form, licenseBack: e.target.files?.[0] ?? null })}
                className="w-full px-4 py-4 bg-gray-900 border border-gray-700 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary file:text-black file:font-medium"
              />
            </label>
            <label className="block" htmlFor="insurance">
              <span className="text-gray-400 block mb-1">Seguro</span>
              <input
                id="insurance"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setForm({ ...form, insurance: e.target.files?.[0] ?? null })}
                className="w-full px-4 py-4 bg-gray-900 border border-gray-700 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary file:text-black file:font-medium"
              />
            </label>
            <label className="block" htmlFor="registration">
              <span className="text-gray-400 block mb-1">Registo do Veículo</span>
              <input
                id="registration"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setForm({ ...form, registration: e.target.files?.[0] ?? null })}
                className="w-full px-4 py-4 bg-gray-900 border border-gray-700 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary file:text-black file:font-medium"
              />
            </label>
          </div>
        )}

        {submitError && (
          <p className="mt-4 text-red-400 text-sm">{submitError}</p>
        )}
        <div className="flex gap-4 mt-10">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex-1 py-4 bg-gray-800 rounded-xl font-semibold text-lg"
            >
              Voltar
            </button>
          ) : null}
          <button
            type="button"
            onClick={() =>
              step < 3 ? setStep(step + 1) : handleSubmit()
            }
            disabled={loading}
            className="flex-1 py-4 bg-green-600 rounded-xl font-semibold text-lg hover:bg-green-500 disabled:opacity-50"
          >
            {step < 3 ? 'Continuar' : loading ? 'A submeter...' : 'Submeter'}
          </button>
        </div>
      </div>
    </div>
  );
}
