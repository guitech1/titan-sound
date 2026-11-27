import Link from "next/link";
import { MessageCircle, Shield, Truck, Lock } from "lucide-react";

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "573502625621";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="container mx-auto grid gap-10 px-4 py-12 md:grid-cols-4">
        <div className="md:col-span-1">
          <p className="mb-2 text-lg font-bold tracking-wide">TITAN SOUND</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Som automotivo de alta performance. Qualidade, potência e atendimento
            especializado.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/40 px-2.5 py-1 text-[11px] text-muted-foreground">
              <Shield className="h-3 w-3 text-primary" /> Compra segura
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/40 px-2.5 py-1 text-[11px] text-muted-foreground">
              <Lock className="h-3 w-3 text-primary" /> LGPD
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/40 px-2.5 py-1 text-[11px] text-muted-foreground">
              <Truck className="h-3 w-3 text-primary" /> Frete grátis R$ 250+
            </span>
          </div>
        </div>

        <div>
          <p className="mb-3 font-semibold">Loja</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link href="/produtos" className="hover:text-primary">
                Produtos
              </Link>
            </li>
            <li>
              <Link href="/avaliacoes" className="hover:text-primary">
                Avaliações
              </Link>
            </li>
            <li>
              <Link href="/carrinho" className="hover:text-primary">
                Carrinho
              </Link>
            </li>
            <li>
              <Link href="/auth/login" className="hover:text-primary">
                Minha conta
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="mb-3 font-semibold">Institucional</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link href="/politica-de-entrega" className="hover:text-primary">
                Política de entrega
              </Link>
            </li>
            <li>
              <Link href="/trocas-e-devolucoes" className="hover:text-primary">
                Trocas e devoluções
              </Link>
            </li>
            <li>
              <Link href="/garantia" className="hover:text-primary">
                Garantia
              </Link>
            </li>
            <li>
              <Link href="/privacidade" className="hover:text-primary">
                Privacidade e LGPD
              </Link>
            </li>
            <li>
              <Link href="/termos" className="hover:text-primary">
                Termos de uso
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="mb-3 font-semibold">Atendimento</p>
          <a
            href={`https://wa.me/${WHATSAPP}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
          <p className="mt-3 text-xs text-muted-foreground">
            Pagamento processado de forma segura via PIX. Dados protegidos conforme a LGPD.
          </p>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} TITAN SOUND. Todos os direitos reservados.
      </div>
    </footer>
  );
}
