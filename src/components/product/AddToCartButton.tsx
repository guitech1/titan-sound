"use client";

import { useState } from "react";
import { useCartStore } from "@/store/cart";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function AddToCartButton({
  product,
  disabled,
  className,
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
  className?: string;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const [done, setDone] = useState(false);

  return (
    <Button
      size="lg"
      disabled={disabled}
      className={cn("gap-2", className)}
      onClick={() => {
        addItem(product);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
    >
      {done ? (
        <>
          <Check className="h-4 w-4" />
          Adicionado!
        </>
      ) : disabled ? (
        "Indisponível"
      ) : (
        <>
          <ShoppingCart className="h-4 w-4" />
          Adicionar ao carrinho
        </>
      )}
    </Button>
  );
}
