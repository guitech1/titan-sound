"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, ShoppingCart, User, MessageCircle } from "lucide-react";
import { useCartStore } from "@/store/cart";

const WA = "https://wa.me/573502625621";

const items = [
  { href: "/", label: "Início", icon: Home },
  { href: "/produtos", label: "Produtos", icon: Package },
  { href: "/carrinho", label: "Carrinho", icon: ShoppingCart, cart: true },
  { href: "/conta", label: "Conta", icon: User },
  { href: WA, label: "Suporte", icon: MessageCircle, external: true },
];

export function BottomNav() {
  const pathname = usePathname();
  const count = useCartStore((s) => s.getItemCount());

  if (pathname.startsWith("/admin") || pathname.startsWith("/auth")) {
    return null;
  }

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 border-t border-white/10 bg-[#070b14]/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
      aria-label="Navegação principal"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-between px-1">
        {items.map((item) => {
          const active =
            !item.external &&
            (item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href));
          const Icon = item.icon;
          const className = `relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${
            active ? "text-primary" : "text-muted-foreground hover:text-white"
          }`;

          const content = (
            <>
              <span className="relative">
                <Icon
                  className={`h-5 w-5 ${active ? "drop-shadow-[0_0_8px_rgba(14,165,233,0.6)]" : ""}`}
                  strokeWidth={active ? 2.5 : 2}
                />
                {item.cart && count > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </span>
              <span>{item.label}</span>
              {active && (
                <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" />
              )}
            </>
          );

          if (item.external) {
            return (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={className}
              >
                {content}
              </a>
            );
          }

          return (
            <Link key={item.label} href={item.href} className={className}>
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
