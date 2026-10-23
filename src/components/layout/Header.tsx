"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X, ShoppingCart, Search, User } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useAuthStore } from "@/store/auth";

export function Header() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const itemCount = useCartStore((s) => s.getItemCount());
  const user = useAuthStore((s) => s.user);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070b14]/90 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center gap-3 px-4">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary/30 to-sky-500/10 ring-1 ring-primary/30">
            <Image src="/logo.png" alt="TITAN SOUND" width={32} height={32} className="object-contain" priority />
          </span>
          <span className="hidden font-bold tracking-tight text-white sm:inline">
            TITAN <span className="text-primary">SOUND</span>
          </span>
        </Link>

        <form className="hidden md:flex flex-1 max-w-xl mx-auto" action="/produtos" method="get">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              name="q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar alto-falantes, módulos..."
              className="h-10 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 text-sm text-white placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </form>

        <nav className="hidden lg:flex items-center gap-1 text-sm">
          <Link href="/produtos" className="rounded-lg px-3 py-2 text-slate-300 hover:bg-white/5 hover:text-white">Produtos</Link>
          <Link href="/avaliacoes" className="rounded-lg px-3 py-2 text-slate-300 hover:bg-white/5 hover:text-white">Avaliações</Link>
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Link href={user ? "/conta" : "/auth/login"} className="rounded-xl p-2.5 text-slate-300 hover:bg-white/5 hover:text-white" aria-label="Conta">
            <User className="h-5 w-5" />
          </Link>
          <Link href="/carrinho" className="relative rounded-xl p-2.5 text-slate-300 hover:bg-white/5 hover:text-white" aria-label="Carrinho">
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">{itemCount}</span>
            )}
          </Link>
          <button type="button" className="rounded-xl p-2.5 text-slate-300 hover:bg-white/5 lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/10 px-4 py-3 lg:hidden space-y-1 bg-[#070b14]">
          <form action="/produtos" method="get" className="mb-2">
            <input name="q" placeholder="Buscar..." className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm" />
          </form>
          <Link href="/produtos" className="block rounded-lg px-3 py-2.5 hover:bg-white/5" onClick={() => setOpen(false)}>Produtos</Link>
          <Link href="/avaliacoes" className="block rounded-lg px-3 py-2.5 hover:bg-white/5" onClick={() => setOpen(false)}>Avaliações</Link>
          <Link href="/carrinho" className="block rounded-lg px-3 py-2.5 hover:bg-white/5" onClick={() => setOpen(false)}>Carrinho</Link>
          <Link href={user ? "/conta" : "/auth/login"} className="block rounded-lg px-3 py-2.5 hover:bg-white/5" onClick={() => setOpen(false)}>
            {user ? "Minha conta" : "Entrar"}
          </Link>
        </div>
      )}
    </header>
  );
}
