/**
 * Pillar 5: Legal Shield — Privacy Policy (Compliance-as-Code)
 * PT-MZ, Mozambique. Data handling disclosure.
 */
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Política de Privacidade | Tuma Taxi',
  description: 'Política de privacidade e proteção de dados da Tuma Taxi, Moçambique.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Política de Privacidade</h1>
        <p className="text-gray-400 text-sm mb-10">Última atualização: 2025</p>

        <section className="space-y-6 text-gray-300">
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">1. Quem somos</h2>
            <p>
              A Tuma Taxi é uma plataforma de transporte (ridesharing) que liga passageiros e motoristas em Moçambique.
              Tratamos os seus dados de forma transparente e em conformidade com as boas práticas de proteção de dados.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">2. Dados que recolhemos</h2>
            <p>
              Recolhemos dados necessários ao serviço: nome, email, telemóvel (opcional), dados de localização durante
              a viagem, dados de veículo e documentos (para motoristas), e dados de transação quando aplicável.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">3. Finalidade do tratamento</h2>
            <p>
              Os dados são usados para criar e gerir a sua conta, prestar o serviço de viagem, processar pagamentos,
              cumprir obrigações legais e melhorar a segurança e a experiência do utilizador.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">4. Base legal</h2>
            <p>
              O tratamento assenta na execução do contrato de utilização do serviço, no consentimento (quando aplicável)
              e no legítimo interesse para segurança e melhoria do serviço.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">5. Partilha de dados</h2>
            <p>
              Os dados podem ser partilhados com prestadores de serviços (hospedagem, pagamentos, comunicações) e
              autoridades quando exigido por lei. Não vendemos os seus dados pessoais.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">6. Retenção e direitos</h2>
            <p>
              Conservamos os dados pelo tempo necessário ao serviço e às obrigações legais. Tem direito a aceder,
              retificar, apagar e portar os seus dados, e a opor-se ou limitar certos tratamentos. Contacte-nos para
              exercer estes direitos.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">7. Segurança</h2>
            <p>
              Aplicamos medidas técnicas e organizativas adequadas para proteger os seus dados contra acesso não
              autorizado, perda ou alteração.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">8. Contacto</h2>
            <p>
              Para questões sobre privacidade ou para exercer os seus direitos, contacte-nos através do email de
              suporte indicado na aplicação ou no site.
            </p>
          </div>
        </section>

        <footer className="mt-12 pt-8 border-t border-gray-800 flex flex-wrap gap-4">
          <Link href="/" className="text-primary font-medium hover:underline">
            ← Voltar ao início
          </Link>
          <Link href="/terms" className="text-primary font-medium hover:underline">
            Termos e Condições
          </Link>
        </footer>
      </div>
    </div>
  );
}
