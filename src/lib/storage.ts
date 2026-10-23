import { createClient } from "@/lib/supabase/client";

const BUCKET = "titan-sound-media";
const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * Upload product/banner image to Supabase Storage.
 * Requires authenticated admin (RLS/Storage policies on the project).
 * Returns the public URL of the uploaded object.
 */
export async function uploadProductImage(
  file: File,
  folder = "products"
): Promise<{ url: string; path: string }> {
  if (!ALLOWED.includes(file.type)) {
    throw new Error("Formato inválido. Use JPEG, PNG, WebP ou GIF.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Imagem muito grande (máx. 5MB).");
  }

  const supabase = createClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });

  if (error) {
    throw new Error(error.message || "Falha no upload.");
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

export async function removeStoragePath(path: string): Promise<void> {
  const supabase = createClient();
  await supabase.storage.from(BUCKET).remove([path]);
}

export { BUCKET as STORAGE_BUCKET };
