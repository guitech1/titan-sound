"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Users, RefreshCw } from "lucide-react";

type Customer = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: "admin" | "customer";
  created_at: string;
  last_sign_in_at: string | null;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadUsers() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/users", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível carregar os clientes.");
      setUsers(result.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar clientes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    if (!term) return users;
    return users.filter((user) =>
      [user.full_name, user.email, user.phone].some((value) =>
        value?.toLocaleLowerCase("pt-BR").includes(term)
      )
    );
  }, [users, search]);

  const dateLabel = (value: string) =>
    new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value));

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Contas cadastradas na Titan Sound, sincronizadas com Supabase Auth e perfis.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadUsers()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </button>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Contas cadastradas</p>
          <p className="mt-1 text-2xl font-semibold">{users.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Clientes</p>
          <p className="mt-1 text-2xl font-semibold">{users.filter((user) => user.role === "customer").length}</p>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-lg border border-border bg-card px-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nome, e-mail ou telefone"
          className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm">
          <p className="font-medium">Não foi possível carregar os clientes.</p>
          <p className="mt-1 text-muted-foreground">{error}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            A listagem consulta usuários do Auth no servidor; a chave de serviço nunca é enviada ao navegador.
          </p>
        </div>
      ) : loading ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">
          Carregando clientes...
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-medium">{users.length === 0 ? "Nenhuma conta cadastrada" : "Nenhum resultado encontrado"}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {users.length === 0
              ? "Os usuários criados pela loja aparecerão aqui automaticamente."
              : "Tente buscar por outro nome, e-mail ou telefone."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-secondary/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Telefone</th>
                  <th className="px-4 py-3 font-medium">Cadastro</th>
                  <th className="px-4 py-3 font-medium">Perfil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-secondary/30">
                    <td className="px-4 py-3">
                      <p className="font-medium">{user.full_name || "Nome não informado"}</p>
                      <p className="text-xs text-muted-foreground">{user.email || "E-mail não informado"}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{user.phone || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{dateLabel(user.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${user.role === "admin" ? "bg-primary/15 text-primary" : "bg-secondary text-secondary-foreground"}`}>
                        {user.role === "admin" ? "Administrador" : "Cliente"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
            Exibindo {filteredUsers.length} de {users.length} contas.
          </p>
        </div>
      )}
    </section>
  );
}
