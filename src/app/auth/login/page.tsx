"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await login(email, password);
    if (!res.success) {
      setError(res.error || "Falha no login");
      return;
    }
    router.push("/");
  };

  return (
    <div className="container max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold mb-6 text-center">Entrar</h1>
      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-border bg-card p-6">
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        <div>
          <label className="block text-sm mb-1.5">E-mail</label>
          <input
            type="email"
            required
            className="w-full h-11 rounded-lg border border-border bg-secondary/50 px-4 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm mb-1.5">Senha</label>
          <input
            type="password"
            required
            className="w-full h-11 rounded-lg border border-border bg-secondary/50 px-4 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Entrando..." : "Entrar"}
        </Button>
        <p className="text-sm text-center text-muted-foreground">
          Não tem conta?{" "}
          <Link href="/auth/registro" className="text-primary hover:underline">
            Cadastre-se
          </Link>
        </p>
      </form>
    </div>
  );
}
