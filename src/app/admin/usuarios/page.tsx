"use client";

export default function AdminUsersPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Clientes</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Listagem de usuários cadastrados. Disponível após conexão com o banco de dados.
      </p>
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <p className="text-muted-foreground">
          Nenhum cliente listado. O módulo está preparado para consumir a tabela de usuários
          quando o schema Supabase for entregue.
        </p>
        <p className="text-xs text-muted-foreground mt-3">
          A permissão de administrador continua sendo atribuída no banco (role = admin).
          Não existe cadastro separado de admin.
        </p>
      </div>
    </div>
  );
}
