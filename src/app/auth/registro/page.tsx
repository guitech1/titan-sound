"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await register({ email, password, full_name: fullName });
    if (!res.success) {
      setError(res.error || "Falha no cadastro");
      return;
    }
    router.push("/");
  };

  return (
    <div className="container max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold mb-6 text-center">Criar conta</h1>
      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-border bg-card p-6">
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div>
          <label className="block text-sm mb-1.5">Nome completo</label>
          <input className="w-full h-11 rounded-lg border border-border bg-secondary/50 px-4 text-sm" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1.5">E-mail</label>
          <input type="email" className="w-full h-11 rounded-lg border border-border bg-secondary/50 px-4 text-sm" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1.5">Senha</label>
          <input type="password" minLength={6} className="w-full h-11 rounded-lg border border-border bg-secondary/50 px-4 text-sm" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Criando..." : "Cadastrar"}
        </Button>
        <p className="text-sm text-center text-muted-foreground">
          Já tem conta? <Link href="/auth/login" className="text-primary hover:underline">Entrar</Link>
        </p>
      </form>
    </div>
  );
}
