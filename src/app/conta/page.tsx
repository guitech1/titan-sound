"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";

export default function AccountPage() {
  const { user, logout } = useAuthStore();

  if (!user) {
    return (
      <div className="container px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Minha conta</h1>
        <p className="text-muted-foreground mb-6">Faça login para acessar sua conta.</p>
        <Button asChild>
          <Link href="/auth/login">Entrar</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">Olá, {user.full_name || user.email}</h1>
      <p className="text-sm text-muted-foreground mb-8">{user.email}</p>
      {user.role === "admin" && (
        <Button asChild className="mb-6">
          <Link href="/admin">Painel administrativo</Link>
        </Button>
      )}
      <Button variant="outline" onClick={() => logout()}>
        Sair da conta
      </Button>
    </div>
  );
}
