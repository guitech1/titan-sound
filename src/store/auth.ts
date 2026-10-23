"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/types";
import type { Profile } from "@/types/database";

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  initialized: boolean;
  setUser: (user: User | null) => void;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { email: string; password: string; full_name: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAdmin: () => boolean;
}

function mapProfile(profile: Profile, email?: string | null): User {
  return {
    id: profile.id,
    email: profile.email || email || "",
    full_name: profile.full_name,
    phone: profile.phone,
    role: profile.role === "admin" ? "admin" : "customer",
    avatar_url: profile.avatar_url,
    is_active: profile.is_active ?? true,
    created_at: profile.created_at || "",
    updated_at: profile.updated_at || "",
  };
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isLoading: false,
  initialized: false,

  setUser: (user) => set({ user }),

  initialize: async () => {
    if (get().initialized) return;
    const supabase = createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();
      if (profile) {
        set({ user: mapProfile(profile as Profile, authUser.email), initialized: true });
        return;
      }
    }
    set({ user: null, initialized: true });
  },

  login: async (email, password) => {
    set({ isLoading: true });
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      set({ isLoading: false });
      return { success: false, error: error?.message || "E-mail ou senha inválidos." };
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .maybeSingle();
    if (profile) {
      set({ user: mapProfile(profile as Profile, data.user.email), isLoading: false });
    } else {
      set({
        user: {
          id: data.user.id,
          email: data.user.email || email,
          full_name: data.user.user_metadata?.full_name || null,
          phone: null,
          role: "customer",
          avatar_url: null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        isLoading: false,
      });
    }
    return { success: true };
  },

  register: async ({ email, password, full_name }) => {
    set({ isLoading: true });
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name } },
    });
    if (error || !data.user) {
      set({ isLoading: false });
      return { success: false, error: error?.message || "Não foi possível criar a conta." };
    }
    await new Promise((r) => setTimeout(r, 500));
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .maybeSingle();
    if (profile) {
      set({ user: mapProfile(profile as Profile, data.user.email), isLoading: false });
    } else {
      set({
        user: {
          id: data.user.id,
          email,
          full_name,
          phone: null,
          role: "customer",
          avatar_url: null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        isLoading: false,
      });
    }
    return { success: true };
  },

  logout: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ user: null });
  },

  isAdmin: () => get().user?.role === "admin",
}));
