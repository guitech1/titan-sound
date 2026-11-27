import Link from "next/link";
import { RefreshCw, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Trocas e Devoluções | Titan Sound",
  description: "Política de trocas, devoluções e direito de arrependimento.",
};

export default function TrocasPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>
      <div className="mb-6 flex items-center gap-3">
        <RefreshCw className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold md:text-3xl">Trocas e Devoluções</h1>
      </div>
      <div className="prose prose-invert max-w-none space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">Direito de arrependimento</h2>
          <p>
            Nas compras realizadas fora do estabelecimento comercial (incluindo internet),
            o Código de Defesa do Consumidor garante o direito de arrependimento em até 7
            dias corridos, contados a partir do recebimento do produto ou da assinatura do
            contrato, conforme o art. 49 do CDC.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">Trocas e devoluções por defeito</h2>
          <p>
            Em caso de produto com defeito (vício), o consumidor tem direitos legais de
            reparo, substituição ou, nas hipóteses previstas em lei, restituição do valor
            ou abatimento proporcional. Entre em contato com a loja informando o pedido e
            a descrição do problema.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">Como solicitar</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>Entre em contato pelo WhatsApp oficial ou atendimento, com o número do pedido.</li>
            <li>Informe o motivo (arrependimento, defeito, etc.) e anexe fotos se solicitado.</li>
            <li>Aguarde as orientações sobre devolução, troca ou reembolso.</li>
          </ol>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">Condições gerais</h2>
          <p>
            Produtos devem ser devolvidos, quando aplicável, em condições adequadas,
            preferencialmente na embalagem original e com acessórios. A análise de cada
            caso segue a legislação brasileira e as orientações da loja, sem reduzir
            direitos do consumidor.
          </p>
        </section>
        <p className="text-xs">
          Esta página é informativa. Em conflito com a lei, prevalece a legislação
          consumerista vigente.
        </p>
      </div>
    </div>
  );
}
