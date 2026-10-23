# Supabase RLS — ajustes necessários

Com a publishable key, algumas tabelas retornam `permission denied for function is_admin`.

Isso indica que políticas de SELECT em categories/products/banners/reviews chamam is_admin() de forma incompatível com anon.

## Leitura pública

No SQL Editor, garanta policies de SELECT para anon/authenticated em products, categories, product_images, banners (ativos) e reviews (publicadas).

## Service role

Para o webhook FluxPay, defina SUPABASE_SERVICE_ROLE_KEY no servidor (nunca no frontend).
