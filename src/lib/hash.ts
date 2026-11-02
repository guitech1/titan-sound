import { createHash } from "crypto";

/** Hash SHA-256 de string (uso server-side apenas). */
export function sha256(value: string): string {
  return createHash("sha256").update(value.normalize("NFKC")).digest("hex");
}

/** Hash do CPF normalizado (apenas dígitos). */
export function hashCpf(cpf: string): string {
  const digits = (cpf || "").replace(/\D/g, "");
  return sha256(digits);
}
