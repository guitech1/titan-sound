import { NextResponse } from "next/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data: requesterProfile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || requesterProfile?.role !== "admin") {
    return NextResponse.json({ error: "Acesso restrito a administradores." }, { status: 403 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return NextResponse.json(
      { error: "A chave administrativa do Supabase não está configurada no servidor (SUPABASE_SERVICE_ROLE_KEY)." },
      { status: 503 }
    );
  }

  const admin = createSupabaseAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const authUsers: Array<{
    id: string;
    email?: string;
    created_at: string;
    last_sign_in_at?: string;
    user_metadata?: Record<string, unknown>;
  }> = [];

  for (let page = 1; page <= 100; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) {
      return NextResponse.json({ error: "Não foi possível consultar os usuários do Supabase Auth." }, { status: 502 });
    }
    authUsers.push(...data.users);
    if (data.users.length < 100) break;
  }

  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("id, full_name, phone, avatar_url, role, created_at, updated_at");

  if (profilesError) {
    return NextResponse.json({ error: "Não foi possível consultar os perfis dos clientes." }, { status: 502 });
  }

  const profileById = new Map((profiles || []).map((profile) => [profile.id, profile]));
  const users = authUsers.map((authUser) => {
    const profile = profileById.get(authUser.id);
    const metadataName = authUser.user_metadata?.full_name;
    return {
      id: authUser.id,
      email: authUser.email || "",
      full_name: profile?.full_name || (typeof metadataName === "string" ? metadataName : null),
      phone: profile?.phone || null,
      avatar_url: profile?.avatar_url || null,
      role: profile?.role === "admin" ? "admin" : "customer",
      created_at: profile?.created_at || authUser.created_at,
      last_sign_in_at: authUser.last_sign_in_at || null,
    };
  });

  users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return NextResponse.json({ users });
}
