"use client";

import { cn } from "@/lib/utils";

/**
 * Logo oficial do Pix (marca Banco Central).
 * Usa o arquivo em /public/pix-logo.svg
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
      className={cn("shrink-0 rounded-xl object-cover", className)}
      draggable={false}
    />
  );
}

/** Versão horizontal com texto "pix" (para cabeçalhos) */
export function PixLogoHorizontal({ className }: { className?: string }) {
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <PixLogo size={32} />
      <span className="text-lg font-semibold tracking-tight text-[#32BCAD]">
        pix
      </span>
    </div>
  );
}
