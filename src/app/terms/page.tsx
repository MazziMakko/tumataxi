/**
 * Pillar 5: Legal Shield — Terms of Service (Compliance-as-Code)
 * PT-MZ, Mozambique.
 */
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Termos e Condições | Tuma Taxi',
  description: 'Termos e condições de utilização da plataforma Tuma Taxi, Moçambique.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Termos e Condições</h1>
        <p className="text-gray-400 text-sm mb-10">Última atualização: 2025</p>

        <section className="space-y-6 text-gray-300">
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">1. Aceitação</h2>
            <p>
              Ao utilizar a aplicação e os serviços Tuma Taxi, aceita estes termos e condições. Se não concordar, não
              utilize o serviço.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">2. Serviço</h2>
            <p>
              A Tuma Taxi disponibiliza uma plataforma que liga passageiros a motoristas independentes para viagens em
              Moçambique. A Tuma Taxi não é transportadora; o contrato de transporte é entre passageiro e motorista.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">3. Registo e conta</h2>
            <p>
              Deve fornecer informações verdadeiras ao registar-se. É responsável por manter a confidencialidade da sua
              conta e por todas as atividades realizadas com ela.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">4. Condutas</h2>
            <p>
              O utilizador compromete-se a usar o serviço de forma legal e respeitosa. É proibido usar a plataforma para
              atividades ilegais, abusivas ou que ponham em risco a segurança de outros.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">5. Pagamentos e preços</h2>
            <p>
              Os preços são indicados na aplicação antes da confirmação da viagem. O pagamento é processado conforme
              os métodos disponíveis na plataforma. Políticas de reembolso aplicam-se conforme indicado no suporte.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">6. Limitação de responsabilidade</h2>
            <p>
              Na medida permitida por lei, a Tuma Taxi não se responsabiliza por danos indiretos, lucros cessantes ou
              prejuízos decorrentes do uso ou da indisponibilidade do serviço, salvo em caso de dolo ou negligência
              grave.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">7. Alterações</h2>
            <p>
              Podemos alterar estes termos com aviso prévio quando possível. O uso continuado do serviço após as
              alterações constitui aceitação dos novos termos.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">8. Lei aplicável</h2>
            <p>
              Estes termos regem-se pela lei da República de Moçambique. Litígios serão submetidos aos tribunais
              competentes em Moçambique.
            </p>
          </div>
        </section>

        <footer className="mt-12 pt-8 border-t border-gray-800 flex flex-wrap gap-4">
          <Link href="/" className="text-primary font-medium hover:underline">
            ← Voltar ao início
          </Link>
          <Link href="/privacy" className="text-primary font-medium hover:underline">
            Política de Privacidade
          </Link>
        </footer>
      </div>
    </div>
  );
}
