"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product, Banner, Coupon, Order, OrderStatus } from "@/types";
import { mockProducts, mockBanners } from "@/services/mock-data";

export interface Review {
  id: string;
  author_name: string;
  rating: number;
  comment: string;
  photo_url?: string;
  is_published: boolean;
  created_at: string;
}

export interface AdminProduct extends Omit<Product, "images"> {
  image_url: string;
}

interface AdminDataStore {
  products: AdminProduct[];
  banners: Banner[];
  coupons: Coupon[];
  reviews: Review[];
  orders: Order[];
  addProduct: (p: Omit<AdminProduct, "id" | "created_at" | "updated_at">) => void;
  updateProduct: (id: string, data: Partial<AdminProduct>) => void;
  deleteProduct: (id: string) => void;
  addBanner: (b: Omit<Banner, "id" | "created_at">) => void;
  updateBanner: (id: string, data: Partial<Banner>) => void;
  deleteBanner: (id: string) => void;
  addCoupon: (c: Omit<Coupon, "id" | "created_at" | "used_count">) => void;
  updateCoupon: (id: string, data: Partial<Coupon>) => void;
  deleteCoupon: (id: string) => void;
  addReview: (r: Omit<Review, "id" | "created_at">) => void;
  updateReview: (id: string, data: Partial<Review>) => void;
  deleteReview: (id: string) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
}

const seedProducts: AdminProduct[] = mockProducts.map((p) => ({
  ...p,
  image_url: p.images[0]?.url || "",
}));

export const useAdminData = create<AdminDataStore>()(
  persist(
    (set) => ({
      products: seedProducts,
      banners: [...mockBanners],
      coupons: [],
      reviews: [],
      orders: [],
      addProduct: (p) =>
        set((s) => ({
          products: [
            ...s.products,
            {
              ...p,
              id: `p-${Date.now()}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
        })),
      updateProduct: (id, data) =>
        set((s) => ({
          products: s.products.map((p) =>
            p.id === id ? { ...p, ...data, updated_at: new Date().toISOString() } : p
          ),
        })),
      deleteProduct: (id) =>
        set((s) => ({ products: s.products.filter((p) => p.id !== id) })),
      addBanner: (b) =>
        set((s) => ({
          banners: [
            ...s.banners,
            { ...b, id: `b-${Date.now()}`, created_at: new Date().toISOString() },
          ],
        })),
      updateBanner: (id, data) =>
        set((s) => ({
          banners: s.banners.map((b) => (b.id === id ? { ...b, ...data } : b)),
        })),
      deleteBanner: (id) =>
        set((s) => ({ banners: s.banners.filter((b) => b.id !== id) })),
      addCoupon: (c) =>
        set((s) => ({
          coupons: [
            ...s.coupons,
            {
              ...c,
              id: `c-${Date.now()}`,
              used_count: 0,
              created_at: new Date().toISOString(),
            },
          ],
        })),
      updateCoupon: (id, data) =>
        set((s) => ({
          coupons: s.coupons.map((c) => (c.id === id ? { ...c, ...data } : c)),
        })),
      deleteCoupon: (id) =>
        set((s) => ({ coupons: s.coupons.filter((c) => c.id !== id) })),
      addReview: (r) =>
        set((s) => ({
          reviews: [
            ...s.reviews,
            { ...r, id: `r-${Date.now()}`, created_at: new Date().toISOString() },
          ],
        })),
      updateReview: (id, data) =>
        set((s) => ({
          reviews: s.reviews.map((r) => (r.id === id ? { ...r, ...data } : r)),
        })),
      deleteReview: (id) =>
        set((s) => ({ reviews: s.reviews.filter((r) => r.id !== id) })),
      updateOrderStatus: (id, status) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id ? { ...o, status, updated_at: new Date().toISOString() } : o
          ),
        })),
    }),
    { name: "titan-sound-admin-data" }
  )
);
