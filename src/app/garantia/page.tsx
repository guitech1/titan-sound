import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Garantia | Titan Sound",
  description: "Informações sobre garantia legal e atendimento da Titan Sound.",
};

export default function GarantiaPage() {
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
        <Shield className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold md:text-3xl">Garantia</h1>
      </div>
      <div className="prose prose-invert max-w-none space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">Garantia legal</h2>
          <p>
            Todos os produtos comercializados pela Titan Sound contam com a garantia legal
            prevista no Código de Defesa do Consumidor (Lei nº 8.078/1990). Em regra, o
            prazo de garantia legal é de 90 dias para produtos duráveis, contados a partir
            da entrega efetiva do produto.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">Garantia contratual</h2>
          <p>
            Alguns produtos podem contar com garantia adicional do fabricante ou da loja.
            Quando existir, essa informação constará na embalagem, na nota fiscal ou na
            página do produto. Prazos e condições específicas devem ser confirmados no
            momento da compra.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">Como solicitar atendimento</h2>
          <p>
            Em caso de defeito ou necessidade de suporte, entre em contato pelo WhatsApp
            oficial da loja ou pela área de atendimento, informando o número do pedido e
            uma descrição do problema. Manter a nota fiscal e os dados do pedido facilita
            o atendimento.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">Defeito e vício do produto</h2>
          <p>
            Se o produto apresentar vício de qualidade ou quantidade, o consumidor tem
            direitos previstos em lei, incluindo reparo, substituição ou, nas hipóteses
            legais, restituição ou abatimento do preço. A Titan Sound orienta o cliente
            sobre o procedimento adequado em cada caso.
          </p>
        </section>
        <p className="text-xs">
          Esta página tem caráter informativo e não substitui a legislação vigente nem
          reduz direitos do consumidor.
        </p>
      </div>
    </div>
  );
}
