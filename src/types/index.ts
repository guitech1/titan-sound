export type UserRole = "customer" | "admin";

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt?: string;
  is_primary: boolean;
  sort_order: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description?: string;
  price: number;
  promotional_price?: number | null;
  sku: string;
  stock: number;
  category_id: string;
  brand_id?: string | null;
  model?: string;
  is_active: boolean;
  is_featured: boolean;
  is_new: boolean;
  images: ProductImage[];
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  parent_id?: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image_url: string;
  mobile_image_url?: string;
  link_url?: string;
  button_text?: string;
  sort_order: number;
  is_active: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  min_order_value?: number;
  max_uses?: number;
  used_count: number;
  starts_at?: string | null;
  ends_at?: string | null;
  is_active: boolean;
  created_at: string;
}

export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export interface Order {
  id: string;
  user_id?: string | null;
  status: OrderStatus;
  subtotal: number;
  discount?: number;
  shipping_cost?: number;
  total: number;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
