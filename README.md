# TITAN SOUND

Plataforma de e-commerce profissional de som automotivo.

**Repositório:** https://github.com/guitech1/titan-sound

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 (tema azul/preto)
- Zustand (carrinho, auth, dados admin temporários)
- FluxPay (pagamentos PIX)
- PWA (manifest + Service Worker)

## Como rodar

```bash
npm install
cp .env.example .env.local
npm run dev
```

### Variáveis de ambiente

```
FLUXPAY_API_URL=
FLUXPAY_SECRET_KEY=
FLUXPAY_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Módulos

### Loja
- Homepage com carrossel, categorias, ofertas
- Catálogo com busca, filtros e ordenação
- Página de produto
- Carrinho persistente
- Checkout com CEP (ViaCEP), resumo e PIX
- Avaliações públicas (somente publicadas pelo ADM)
- Área do cliente
- PWA instalável

### Painel Admin (`/admin`)
- Dashboard com indicadores
- Produtos: CRUD completo
- Banners: CRUD + ativar/desativar
- Cupons: criar, regras, validade
- Avaliações: cadastrar, publicar/ocultar, excluir
- Pedidos: listar e atualizar status
- Clientes: preparado para banco
- Configurações da loja

Acesso admin: usuário com `role: "admin"` (atribuído no banco). Não há cadastro separado de administrador.

### Pagamentos (FluxPay)
- `POST /api/payments/create` — cria cobrança PIX (server-side)
- `POST /api/webhooks/fluxpay` — confirma pagamento com validação de assinatura
- Confirmação exclusiva via webhook (nunca só pelo frontend)

## Banco de dados

**Não há migrations nem SQL neste repositório.**  
Outro desenvolvedor entrega o schema Supabase.  
Serviços e tipos em `src/services/` e `src/types/` estão preparados para integração.

Dados de produtos/banners/cupons/avaliações usam armazenamento local temporário (`localStorage` via Zustand) até a conexão definitiva.

## Estrutura

```
src/
├── app/           # Rotas (loja + admin + API)
├── components/    # UI, layout, product, home
├── services/      # products, banners, fluxpay
├── store/         # cart, auth, admin-data
├── types/         # Contratos
└── lib/           # utils
public/
├── logo.png
├── manifest.json
└── sw.js
```

## Licença

Proprietário — TITAN SOUND
