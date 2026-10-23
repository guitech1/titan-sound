import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-border">
        <div className="container mx-auto px-4 py-20 md:py-28 text-center">
          <p className="text-primary text-sm font-semibold tracking-widest uppercase mb-3">
            Som Automotivo
          </p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
            TITAN SOUND
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Alto-falantes, subwoofers, amplificadores e acessórios de alta performance.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/produtos">Ver produtos</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/avaliacoes">Avaliações</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold mb-6 text-center">Por que a TITAN SOUND?</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { t: "Qualidade premium", d: "Equipamentos selecionados para máximo desempenho." },
            { t: "Entrega rápida", d: "Envio ágil e acompanhamento do pedido." },
            { t: "Suporte especializado", d: "Atendimento via WhatsApp com time técnico." },
          ].map((item) => (
            <div key={item.t} className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold mb-2">{item.t}</h3>
              <p className="text-sm text-muted-foreground">{item.d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
