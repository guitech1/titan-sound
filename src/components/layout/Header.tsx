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
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image src="/logo.png" alt="TITAN SOUND" width={40} height={40} className="rounded" />
          <span className="font-bold tracking-tight hidden sm:inline">TITAN SOUND</span>
        </Link>

        <form
          className="hidden md:flex flex-1 max-w-xl mx-auto"
          action="/produtos"
          method="get"
        >
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              name="q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar produtos..."
              className="w-full h-10 rounded-lg border border-border bg-secondary/50 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </form>

        <nav className="hidden lg:flex items-center gap-4 text-sm">
          <Link href="/produtos" className="hover:text-primary">Produtos</Link>
          <Link href="/avaliacoes" className="hover:text-primary">Avaliações</Link>
        </nav>

        <div className="flex items-center gap-2 ml-auto">
          <Link href={user ? "/conta" : "/auth/login"} className="p-2 rounded-lg hover:bg-secondary">
            <User className="h-5 w-5" />
          </Link>
          <Link href="/carrinho" className="relative p-2 rounded-lg hover:bg-secondary">
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-5 min-w-5 rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center px-1">
                {itemCount}
              </span>
            )}
          </Link>
          <button className="lg:hidden p-2" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border px-4 py-3 space-y-2">
          <Link href="/produtos" className="block py-2" onClick={() => setOpen(false)}>Produtos</Link>
          <Link href="/avaliacoes" className="block py-2" onClick={() => setOpen(false)}>Avaliações</Link>
          <Link href="/carrinho" className="block py-2" onClick={() => setOpen(false)}>Carrinho</Link>
          <Link href={user ? "/conta" : "/auth/login"} className="block py-2" onClick={() => setOpen(false)}>
            {user ? "Minha conta" : "Entrar"}
          </Link>
        </div>
      )}
    </header>
  );
}
