/**
 * Legacy local admin store — kept as empty stub so old imports do not break.
 * Real admin CRUD uses Supabase via createClient() in each admin page.
 */
"use client";

import { create } from "zustand";

interface AdminDataStore {
  products: unknown[];
  banners: unknown[];
  coupons: unknown[];
  reviews: unknown[];
  orders: unknown[];
}

export const useAdminData = create<AdminDataStore>(() => ({
  products: [],
  banners: [],
  coupons: [],
  reviews: [],
  orders: [],
}));
