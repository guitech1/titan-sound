"use client";

import { useState } from "react";
import { useCartStore } from "@/store/cart";
import { Button } from "@/components/ui/button";

export function AddToCartButton({
  product,
  disabled,
}: {
  product: {
    product_id: string;
    name: string;
    slug: string;
    price: number;
    image?: string;
    sku?: string;
  };
  disabled?: boolean;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const [done, setDone] = useState(false);

  return (
    <Button
      size="lg"
      disabled={disabled}
      onClick={() => {
        addItem(product);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
    >
      {done ? "Adicionado!" : "Adicionar ao carrinho"}
    </Button>
  );
}
