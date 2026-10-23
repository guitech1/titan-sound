import Link from "next/link";
import Image from "next/image";
import { Truck, Shield, Zap, Headphones, ArrowRight } from "lucide-react";
import {
  getFeaturedProducts,
  getBestSellerProducts,
  getNewProducts,
  getCategories,
} from "@/services/products";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const [featured, bestSellers, newest, categories] = await Promise.all([
    getFeaturedProducts(8),
    getBestSellerProducts(4),
    getNewProducts(8),
    getCategories(),
  ]);

  const showcase = featured.length ? featured : newest;
  const sellers = bestSellers.length ? bestSellers : newest.slice(0, 4);

  return (
    <div className="pb-24 md:pb-12">
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(14,165,233,0.25),_transparent_55%),radial-gradient(ellipse_at_bottom_left,_rgba(14,165,233,0.08),_transparent_50%)]" />
        <div className="absolute -right-20 top-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-sky-500/10 blur-3xl" />

        <div className="container relative mx-auto grid items-center gap-8 px-4 py-12 md:grid-cols-2 md:py-16 lg:py-20">
          <div className="order-2 md:order-1">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Som automotivo de alta performance
            </p>
            <h1 className="mb-4 text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Potência.
              <span className="block bg-gradient-to-r from-primary to-sky-300 bg-clip-text text-transparent">
                Precisão. TITAN.
              </span>
            </h1>
            <p className="mb-8 max-w-md text-base text-slate-400">
              Alto-falantes, subwoofers, amplificadores e acessórios selecionados para quem exige qualidade de verdade.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-xl px-8 shadow-lg shadow-primary/30">
                <Link href="/produtos">
                  Ver catálogo
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-xl border-white/15 bg-white/5">
                <a href="https://wa.me/573502625621" target="_blank" rel="noopener noreferrer">
                  Falar no WhatsApp
                </a>
              </Button>
            </div>
          </div>

          <div className="order-1 flex justify-center md:order-2 md:justify-end">
            <div className="relative">
              <div className="absolute inset-0 scale-110 rounded-full bg-primary/30 blur-3xl" />
              <div className="relative flex h-52 w-52 items-center justify-center sm:h-64 sm:w-64 lg:h-72 lg:w-72">
                <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-primary/40 via-transparent to-sky-500/20 opacity-80" />
                <div className="absolute inset-3 rounded-[1.6rem] border border-white/10 bg-gradient-to-b from-white/5 to-transparent backdrop-blur-sm" />
                <Image
                  src="/logo.svg"
                  alt="TITAN SOUND"
                  width={220}
                  height={220}
                  priority
                  className="relative z-10 h-36 w-36 object-contain drop-shadow-[0_20px_50px_rgba(14,165,233,0.45)] sm:h-44 sm:w-44 lg:h-52 lg:w-52"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/5 bg-card/40">
        <div className="container mx-auto grid grid-cols-2 gap-4 px-4 py-6 md:grid-cols-4">
          {[
            { icon: Truck, title: "Envio ágil", desc: "Logística rápida" },
            { icon: Shield, title: "Compra segura", desc: "Dados protegidos" },
            { icon: Zap, title: "Alta performance", desc: "Equipamentos top" },
            { icon: Headphones, title: "Suporte técnico", desc: "WhatsApp direto" },
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {categories.length > 0 && (
        <section className="container mx-auto px-4 py-10">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-xl font-bold text-white sm:text-2xl">Categorias</h2>
            <Link href="/produtos" className="text-sm text-primary hover:underline">Ver tudo</Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/produtos?categoria=${cat.slug}`}
                className="group flex flex-col items-center gap-2 rounded-2xl border border-white/5 bg-card/60 p-4 text-center transition hover:border-primary/40 hover:bg-primary/5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-lg font-bold text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  {cat.name.charAt(0)}
                </div>
                <span className="text-xs font-medium text-slate-300 group-hover:text-white">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="container mx-auto px-4 py-10">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Vitrine</p>
            <h2 className="text-xl font-bold text-white sm:text-2xl">
              {featured.length ? "Em destaque" : "Nossos produtos"}
            </h2>
          </div>
          <Button asChild variant="outline" size="sm" className="rounded-xl border-white/15">
            <Link href="/produtos">Ver todos <ArrowRight className="h-3.5 w-3.5" /></Link>
          </Button>
        </div>
        {showcase.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 py-16 text-center text-sm text-muted-foreground">
            Nenhum produto cadastrado ainda. Cadastre no painel administrativo.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-5">
            {showcase.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {sellers.length > 0 && (
        <section className="border-t border-white/5 bg-gradient-to-b from-card/30 to-transparent">
          <div className="container mx-auto px-4 py-10">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">Ranking</p>
                <h2 className="text-xl font-bold text-white sm:text-2xl">Mais vendidos</h2>
              </div>
              <Link href="/produtos" className="text-sm text-primary hover:underline">Ver catálogo</Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-5">
              {sellers.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {newest.length > 0 && featured.length > 0 && (
        <section className="container mx-auto px-4 py-10">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Novidades</p>
            <h2 className="text-xl font-bold text-white sm:text-2xl">Recém-chegados</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-5">
            {newest.slice(0, 4).map((product) => (
              <ProductCard key={`new-${product.id}`} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
