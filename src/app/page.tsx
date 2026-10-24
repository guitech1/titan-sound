import Link from "next/link";
import { Truck, Shield, Zap, Headphones, ArrowRight } from "lucide-react";
import {
  getFeaturedProducts,
  getBestSellerProducts,
  getNewProducts,
  getCategories,
} from "@/services/products";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { HeroBanner } from "@/components/home/HeroBanner";

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
      <HeroBanner />

      <section className="border-b border-white/5 bg-[#070b14]/80">
        <div className="container mx-auto grid grid-cols-2 gap-4 px-4 py-8 md:grid-cols-4 md:gap-6 md:py-10">
          {[
            { icon: Truck, title: "Entrega rápida", desc: "Envio para todo o Brasil" },
            { icon: Shield, title: "Compra segura", desc: "Pagamento protegido" },
            { icon: Zap, title: "Performance", desc: "Equipamentos de alto nível" },
            { icon: Headphones, title: "Suporte", desc: "Atendimento especializado" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="text-xs text-slate-400">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {categories.length > 0 && (
        <section className="container mx-auto px-4 py-10">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-xl font-bold text-white md:text-2xl">Categorias</h2>
            <Link href="/produtos" className="text-sm text-primary hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {categories.slice(0, 6).map((cat) => (
              <Link
                key={cat.id}
                href={`/produtos?categoria=${cat.slug || cat.id}`}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-5 text-center transition hover:border-primary/40 hover:bg-primary/10"
              >
                <span className="text-sm font-medium text-white">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {showcase.length > 0 && (
        <section className="container mx-auto px-4 py-8">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-xl font-bold text-white md:text-2xl">Em destaque</h2>
            <Link href="/produtos" className="text-sm text-primary hover:underline">
              Ver catálogo
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-5">
            {showcase.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {sellers.length > 0 && (
        <section className="container mx-auto px-4 py-8">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-xl font-bold text-white md:text-2xl">Mais vendidos</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-5">
            {sellers.slice(0, 4).map((product) => (
              <ProductCard key={`bs-${product.id}`} product={product} />
            ))}
          </div>
        </section>
      )}

      {newest.length > 0 && (
        <section className="container mx-auto px-4 py-8">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-xl font-bold text-white md:text-2xl">Novidades</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-5">
            {newest.slice(0, 4).map((product) => (
              <ProductCard key={`new-${product.id}`} product={product} />
            ))}
          </div>
        </section>
      )}

      {!showcase.length && (
        <section className="container mx-auto px-4 py-16 text-center">
          <p className="mb-4 text-slate-400">Catálogo em atualização.</p>
          <Button asChild>
            <Link href="/produtos">
              Explorar produtos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </section>
      )}
    </div>
  );
}
