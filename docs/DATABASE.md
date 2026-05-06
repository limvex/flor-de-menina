# Schema do Banco de Dados — Flor de Menina

## Visão Geral

PostgreSQL 16 via Prisma 7. IDs gerados com cuid2. Soft delete em User, Category, Product (campo deletedAt). Timestamps automáticos (createdAt, updatedAt) em todos os modelos.

## Modelos por Contexto

### Autenticação

- **User** — clientes, operadores e admins (role enum)
- **EmailVerification** — tokens de verificação de e-mail (TTL)
- **PasswordReset** — tokens de reset de senha (TTL)
- **Address** — endereços do usuário

### Catálogo

- **Category** — categorias com hierarquia (parentId) e tabela de medidas (JSON)
- **Product** — produtos com SEO, preço, peso/dimensões para frete
- **ProductImage** — imagens ordenadas por posição
- **ProductVariant** — SKU, tamanho, cor, preço próprio (opcional), estoque

### Estoque

- **StockMovement** — log de todas as entradas/saídas/ajustes (imutável)

### Carrinho e Wishlist

- **Cart** / **CartItem** — carrinho com reserva de estoque de 15 minutos

### Pedidos

- **Order** — pedido com snapshot do endereço
- **OrderItem** — itens com snapshot do produto (nome, cor, tamanho, imagem)

### Pagamento e Frete

- **Payment** — suporta Mercado Pago (PIX + cartão) e modo Mock
- **Shipping** — suporta Melhor Envio e modo Mock, com rastreamento

### Cupons

- **Coupon** — % ou valor fixo, com limites de uso e validade
- **CouponUsage** — tracking de uso por usuário/pedido

### Reviews

- **Review** — avaliação com fotos (URLs R2), moderação manual

### Conteúdo

- **InstitutionalPage** — páginas estáticas (Sobre, FAQ, etc)

## Convenções

- IDs: cuid2 (string, gerado na aplicação, não no banco)
- Soft delete: campo `deletedAt DateTime?` (User, Category, Product)
- Snapshots: OrderItem guarda cópia dos dados do produto no momento da compra
- Enums: UserRole, StockMovementType, OrderStatus, PaymentProvider, PaymentMethod, PaymentStatus, ShippingProvider, CouponType, ReviewStatus

## Como usar

```bash
# Subir banco local
docker compose up -d postgres

# Rodar migrations
pnpm db:migrate

# Popular banco
pnpm db:seed

# Visualizar dados (abre http://localhost:5555)
pnpm db:studio

# Reset completo (cuidado — apaga tudo)
pnpm db:reset

Credenciais de dev (seed)
- Admin: admin@flordemenina.site / admin123
```
