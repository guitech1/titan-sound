"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  product_id: string;
  name: string;
  slug: string;
  image?: string;
  price: number;
  quantity: number;
  sku?: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  getItemCount: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item, qty = 1) =>
        set((s) => {
          const existing = s.items.find((i) => i.product_id === item.product_id);
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.product_id === item.product_id
                  ? { ...i, quantity: i.quantity + qty }
                  : i
              ),
            };
          }
          return { items: [...s.items, { ...item, quantity: qty }] };
        }),
      removeItem: (productId) =>
        set((s) => ({ items: s.items.filter((i) => i.product_id !== productId) })),
      updateQuantity: (productId, quantity) =>
        set((s) => ({
          items:
            quantity <= 0
              ? s.items.filter((i) => i.product_id !== productId)
              : s.items.map((i) =>
                  i.product_id === productId ? { ...i, quantity } : i
                ),
        })),
      clear: () => set({ items: [] }),
      getItemCount: () => get().items.reduce((n, i) => n + i.quantity, 0),
      getSubtotal: () => get().items.reduce((n, i) => n + i.price * i.quantity, 0),
    }),
    { name: "titan-sound-cart" }
  )
);
