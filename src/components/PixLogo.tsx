"use client";

import { cn } from "@/lib/utils";

/**
 * Marca oficial Pix disponibilizada pelo Banco Central do Brasil.
 * Fonte: https://www.bcb.gov.br/content/estabilidadefinanceira/piximg/logo_pix.png
 */
export function PixLogo({
  className,
  size = 44,
}: {
  className?: string;
  size?: number;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="https://www.bcb.gov.br/content/estabilidadefinanceira/piximg/logo_pix.png"
      alt="Pix"
      width={size * 3}
      height={size}
      className={cn("h-11 w-auto shrink-0 object-contain", className)}
      draggable={false}
    />
  );
}
