import Link from "next/link";
import { Truck, ArrowLeft } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  FREE_SHIPPING_THRESHOLD,
  FIXED_SHIPPING_COST,
  ESTIMATED_DELIVERY_MIN_DAYS,
  ESTIMATED_DELIVERY_MAX_DAYS,
} from "@/lib/shipping";

export const metadata = {
  title: "Política de Entrega | Titan Sound",
  description: "Condições de frete e prazos de entrega da Titan Sound.",
};

export default function PoliticaEntregaPage() {
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
        <Truck className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold md:text-3xl">Política de Entrega</h1>
      </div>
      <div className="prose prose-invert max-w-none space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">Frete</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Compras com subtotal (após descontos) <strong>a partir de{" "}
              {formatCurrency(FREE_SHIPPING_THRESHOLD)}</strong>: frete grátis.
            </li>
            <li>
              Compras abaixo de {formatCurrency(FREE_SHIPPING_THRESHOLD)}: frete de{" "}
              <strong>{formatCurrency(FIXED_SHIPPING_COST)}</strong>.
            </li>
          </ul>
          <p className="mt-2">
            O valor do frete é calculado sobre o subtotal dos produtos após a aplicação de
            cupons/descontos, antes de somar o frete.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">Prazo estimado</h2>
          <p>
            O prazo estimado de entrega é de{" "}
            <strong>
              {ESTIMATED_DELIVERY_MIN_DAYS} a {ESTIMATED_DELIVERY_MAX_DAYS} dias
            </strong>
            . Trata-se de uma estimativa comercial da loja e não de cotação em tempo real
            com transportadoras. Prazos podem variar conforme região, disponibilidade e
            condições logísticas.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">Envio</h2>
          <p>
            Os pedidos são processados após a confirmação do pagamento. Não há integração
            automática de rastreamento exibida nesta política; informações de envio são
            comunicadas conforme o andamento do pedido e os canais de atendimento da loja.
          </p>
        </section>
        <p className="text-xs">
          Em caso de dúvida sobre entrega, utilize o WhatsApp oficial ou a área de
          atendimento informando o número do pedido.
        </p>
      </div>
    </div>
  );
}
