/** Legacy stub — admin CRUD uses Supabase directly in each page. */
"use client";

import { create } from "zustand";

export const useAdminData = create(() => ({
  products: [] as unknown[],
  banners: [] as unknown[],
  coupons: [] as unknown[],
  reviews: [] as unknown[],
  orders: [] as unknown[],
}));
