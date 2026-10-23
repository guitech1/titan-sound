export type UserRole = "customer" | "admin";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}
