"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroBanner() {
  return (
    <section className="relative w-full overflow-hidden border-b border-white/5 bg-[#020a10]">
      <div className="relative w-full aspect-[16/9] min-h-[220px] max-h-[min(72vh,640px)] sm:min-h-[280px] md:min-h-[360px]">
        <iframe
          src="/banner-hero.html"
          title="TITAN SOUND — Audio Digital"
          className="absolute inset-0 h-full w-full border-0"
          loading="eager"
          allow="accelerometer"
        />
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-[#020a10]/90 via-transparent to-[#020a10]/35" />
        <div className="absolute inset-x-0 bottom-0 z-20 px-4 pb-5 pt-16 sm:px-6 sm:pb-8 md:px-10">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-xl">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-cyan-300/90 sm:text-xs">
                Audio Digital
              </p>
              <p className="text-sm text-white/80 sm:text-base">
                Alto-falantes, módulos e eletrônicos para quem exige qualidade de verdade.
              </p>
            </div>
            <div className="pointer-events-auto flex flex-wrap gap-2">
              <Button asChild size="lg" className="rounded-xl px-6 shadow-lg shadow-cyan-500/20">
                <Link href="/produtos">
                  Ver catálogo
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-xl border-white/20 bg-black/40 text-white backdrop-blur-sm hover:bg-white/10"
              >
                <Link href="/produtos?destaque=1">Destaques</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
