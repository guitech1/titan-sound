import { createClient } from "@/lib/supabase/server";

export interface StoreProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  sku: string | null;
  stock_quantity: number;
  is_featured: boolean;
  is_best_seller: boolean;
  image_url: string | null;
  short_description?: string | null;
}

function mapRow(row: Record<string, unknown>): StoreProduct {
  const images = (row.product_images as { image_url: string; sort_order?: number }[]) || [];
  images.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    price: Number(row.price),
    compare_at_price: row.compare_at_price != null ? Number(row.compare_at_price) : null,
    sku: (row.sku as string) || null,
    stock_quantity: Number(row.stock_quantity ?? 0),
    is_featured: Boolean(row.is_featured),
    is_best_seller: Boolean(row.is_best_seller),
    image_url: images[0]?.image_url || null,
    short_description: (row.short_description as string) || null,
  };
}

const SELECT =
  "id, name, slug, price, compare_at_price, sku, stock_quantity, is_featured, is_best_seller, short_description, product_images(image_url, sort_order)";

export async function getFeaturedProducts(limit = 8): Promise<StoreProduct[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(SELECT)
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (data?.length) return data.map(mapRow);
  const { data: fallback } = await supabase
    .from("products")
    .select(SELECT)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (fallback || []).map(mapRow);
}

export async function getBestSellerProducts(limit = 8): Promise<StoreProduct[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(SELECT)
    .eq("is_active", true)
    .eq("is_best_seller", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (data?.length) return data.map(mapRow);
  const { data: fallback } = await supabase
    .from("products")
    .select(SELECT)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (fallback || []).map(mapRow);
}

export async function getNewProducts(limit = 8): Promise<StoreProduct[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(SELECT)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data || []).map(mapRow);
}

export async function getCategories() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug, image_url, is_active, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  return data || [];
}
