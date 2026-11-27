import Link from "next/link";
import { Lock, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacidade e LGPD | Titan Sound",
  description: "Política de privacidade e proteção de dados pessoais.",
};

export default function PrivacidadePage() {
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
        <Lock className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold md:text-3xl">Privacidade e LGPD</h1>
      </div>
      <div className="prose prose-invert max-w-none space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">Compromisso</h2>
          <p>
            A Titan Sound trata dados pessoais em conformidade com a Lei Geral de Proteção
            de Dados (Lei nº 13.709/2018 — LGPD) e demais normas aplicáveis.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">Dados coletados</h2>
          <p>
            Podemos coletar dados necessários à compra e ao atendimento, como nome, e-mail,
            telefone, endereço de entrega, CPF (quando exigido para identificação em
            modalidades de pagamento) e dados de navegação. O CPF, quando armazenado para
            parcelamento, é tratado em formato irreversível (hash), sempre que a
            arquitetura do sistema permitir.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">Finalidades</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Processar pedidos e pagamentos</li>
            <li>Entregar produtos e prestar suporte</li>
            <li>Cumprir obrigações legais e regulatórias</li>
            <li>Melhorar a experiência na loja</li>
          </ul>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">Pagamentos</h2>
          <p>
            Os pagamentos via PIX são processados por provedor de pagamento integrado
            (FluxPay). Dados de pagamento são tratados conforme a política do provedor e
            a necessidade de conclusão da transação.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground">Seus direitos</h2>
          <p>
            Você pode solicitar acesso, correção, exclusão ou portabilidade de dados,
            além de outras medidas previstas na LGPD, pelos canais de atendimento da loja.
          </p>
        </section>
        <p className="text-xs">
          Esta política pode ser atualizada. Em caso de dúvida, contate o atendimento
          oficial da Titan Sound.
        </p>
      </div>
    </div>
  );
}
