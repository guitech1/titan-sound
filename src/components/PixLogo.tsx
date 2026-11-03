"use client";

import { cn } from "@/lib/utils";

/**
 * Logo oficial do Pix (marca Banco Central do Brasil).
 * Arquivo: /public/pix-logo.svg
 */
export function PixLogo({
  className,
  size = 40,
}: {
  className?: string;
  size?: number;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/pix-logo.svg"
      alt="Pix"
      width={size}
      height={size}
      className={cn("shrink-0 rounded-xl object-cover shadow-sm", className)}
      draggable={false}
    />
  );
}
