import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container mx-auto px-4 py-12 grid gap-8 md:grid-cols-3">
        <div>
          <p className="font-bold text-lg mb-2">TITAN SOUND</p>
          <p className="text-sm text-muted-foreground">
            Som automotivo de alta performance. Qualidade, potência e instalção profissional.
          </p>
        </div>
        <div>
          <p className="font-semibold mb-3">Links</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/produtos" className="hover:text-primary">Produtos</Link></li>
            <li><Link href="/avaliacoes" className="hover:text-primary">Avaliações</Link></li>
            <li><Link href="/auth/login" className="hover:text-primary">Entrar</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold mb-3">Contato</p>
          <a
            href="https://wa.me/573502625621"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline"
          >
            WhatsApp +57 350 2625621
          </a>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} TITAN SOUND. Todos os direitos reservados.
      </div>
    </footer>
  );
}
