import Link from "next/link";
import { FileText, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Termos de Uso | Titan Sound",
  description: "Termos de uso da loja virtual Titan Sound.",
};

export default function TermosPage() {
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
        <FileText className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold md:text-3xl">Termos de Uso</h1>
      </div>
      <div className="prose prose-invert max-w-none space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">Aceitação</h2>
          <p>
            Ao utilizar a loja virtual Titan Sound, você concorda com estes termos e com
            as políticas de privacidade, entrega, garantia e trocas publicadas no site.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">Produtos e preços</h2>
          <p>
            Preços, disponibilidade e descrições são exibidos conforme o cadastro no
            sistema. A loja se esforça para manter informações atualizadas; eventuais
            erros evidentes podem ser corrigidos antes da conclusão do pedido.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">Pedidos e pagamento</h2>
          <p>
            O pedido só é considerado pago após a confirmação do pagamento pelo provedor
            integrado. Até a confirmação, o status permanece como aguardando pagamento.
            Formas de pagamento disponíveis são as exibidas no checkout (atualmente PIX
            à vista e PIX parcelado, quando oferecido).
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">Conta e segurança</h2>
          <p>
            Você é responsável por manter a confidencialidade de suas credenciais de
            acesso. Comunique imediatamente qualquer uso não autorizado da conta.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">Propriedade intelectual</h2>
          <p>
            Conteúdos, marcas e layout da loja são protegidos. É proibida a reprodução
            não autorizada para fins comerciais.
          </p>
        </section>
        <p className="text-xs">
          Estes termos são complementados pela legislação brasileira aplicável,
          inclusive o Código de Defesa do Consumidor.
        </p>
      </div>
    </div>
  );
}
