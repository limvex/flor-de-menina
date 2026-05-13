# Spec — Task #69 Admin Operacional (escopo reduzido)

Este documento foi escrito **antes** da implementação (spec-driven). O código do repositório usa o enum Prisma `OrderStatus`, onde **PROCESSING** corresponde ao sentido de “preparando envio” descrito na conversa inicial como `SHIPPING`.

---

## 1.1 Spec — `PATCH /admin/orders/:id/status`

### Request

```http
PATCH /admin/orders/:id/status
Cookie: access_token=<admin_jwt>
Content-Type: application/json

{
  "status": "SHIPPED",
  "trackingCode": "BR1234567890BR",
  "notifyCustomer": true,
  "notes": "Enviado via Sedex"
}
```

- `notifyCustomer` default `true` se omitido.
- `trackingCode` obrigatório quando `status` = `SHIPPED` (string não vazia após `trim`).

### Transições válidas (valores Prisma)

```text
PAID        → PROCESSING | CANCELLED   // PROCESSING = preparando envio
PROCESSING → SHIPPED     | CANCELLED
SHIPPED     → DELIVERED
DELIVERED   → (nenhuma)
CANCELLED   → (nenhuma)
REFUNDED    → (nenhuma)
PENDING     → CANCELLED
```

### Regras

1. `trackingCode` obrigatório quando `status` = `SHIPPED`.
2. Transição inválida → **400** com corpo `{ "message": "Transição inválida", "from": "...", "to": "...", "validNext": [...] }`.
3. Para avançar operacionalmente (`PROCESSING`, `SHIPPED`, `DELIVERED`): `payment.status` deve ser `APPROVED`; senão **400** `{ "message": "Pedido com pagamento não aprovado" }`.
   - `PENDING` → `CANCELLED` é permitido com pagamento não aprovado (desistência antes do pagamento).
4. `SHIPPED` + `notifyCustomer === true`: dispara `EmailService.sendOrderShipped(...)` com `trackingUrl` (17track); em dev com Maildev, e-mail visível em `http://localhost:1080`.
5. `DELIVERED` + `notifyCustomer === true`: `EmailService.sendOrderDelivered(...)`.
6. `CANCELLED`:
   - Se status atual for `SHIPPED` ou `DELIVERED` → **400** `{ "message": "Use o fluxo de reembolso para pedidos já enviados" }`.
   - Se o pedido já teve baixa de estoque online (fluxo pago ou pedido criado com reserva conforme regras do projeto), restaurar estoque via `StockService.restoreStockForOrder` **dentro** da mesma transação Prisma onde couber.
   - Reverter cupom quando aplicável (`CouponsService.reverseCouponUsage`) se alinhado ao fluxo de pagamento recusado.
   - Opcional: e-mail de cancelamento ao cliente se `notifyCustomer`.
7. Criar linha em `OrderStatusHistory` (campos `fromStatus`, `toStatus`, `notes`, `changedByUserId`, `createdAt`).
8. Lógica principal de persistência em `prisma.$transaction`. Envio de e-mail **após** commit da transação (para não reverter fila SMTP caso falhe log local).

### Response sucesso (exemplo)

```json
{
  "id": "order_xyz",
  "number": "FDM-2026-00123",
  "status": "SHIPPED",
  "trackingCode": "BR1234567890BR",
  "trackingUrl": "https://t.17track.net/pt#nums=BR1234567890BR",
  "updatedAt": "2026-05-11T18:30:00.000Z",
  "notifiedCustomer": true,
  "history": [
    {
      "fromStatus": "PAID",
      "toStatus": "PROCESSING",
      "at": "2026-05-11T10:00:00.000Z",
      "notes": null
    },
    {
      "fromStatus": "PROCESSING",
      "toStatus": "SHIPPED",
      "at": "2026-05-11T18:30:00.000Z",
      "notes": "Enviado via Sedex"
    }
  ]
}
```

### Response erros

| Cenário                                    | Status | Body                                                                                  |
| ------------------------------------------ | ------ | ------------------------------------------------------------------------------------- |
| Pedido não existe                          | 404    | `{ "message": "Pedido não encontrado" }`                                              |
| Transição inválida                         | 400    | `{ "message": "Transição inválida", "from": "...", "to": "...", "validNext": [...] }` |
| SHIPPED sem trackingCode                   | 400    | `{ "message": "trackingCode obrigatório para status SHIPPED" }`                       |
| Pagamento não aprovado (fluxo operacional) | 400    | `{ "message": "Pedido com pagamento não aprovado" }`                                  |
| CANCELLED após envio/entrega               | 400    | `{ "message": "Use o fluxo de reembolso para pedidos já enviados" }`                  |
| Sem auth admin                             | 401    | padrão Nest                                                                           |

---

## 1.2 Spec — E-mail “Pedido enviado”

**Trigger:** `EmailService.sendOrderShipped(payload)` após `SHIPPED` com notificação.

**Payload:**

```typescript
{
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  trackingCode: string;
  trackingUrl: string;
  shippingMethod: string;
  estimatedDelivery?: string;
  items: Array<{ name: string; quantity: number; imageUrl?: string | null }>;
  shippingAddressSummary: string;
}
```

**Conteúdo:** logo/marca, saudação, número do pedido, caixa com código de rastreio, botão “Rastrear pedido” (`trackingUrl`), lista de itens com imagem opcional, resumo do endereço, texto de entrega estimada se houver, rodapé com WhatsApp (link via env quando existir).

**Dev:** SMTP Maildev (`SMTP_HOST`, `SMTP_PORT`, tipicamente `localhost:1025`). **Prod:** enfileirar via `MailService` / Resend quando `MAIL_PROVIDER` ≠ `maildev` (evolução Task #22).

---

## 1.3 Spec — E-mails “Entregue” e “Cancelado”

Triggers: `EmailService.sendOrderDelivered`, `EmailService.sendOrderCancelled` com payloads alinhados ao pedido e notificação opcional; mesma estratégia Maildev em dev e fila em prod.

---

## 1.4 Spec — UI Admin (`/admin/pedidos/[id]`)

- Seção **“Atualizar status”** com estado atual visível (`OrderStatusUpdater`).
- Select de **próximo status** apenas com opções retornadas por `GET /admin/orders/:id/valid-transitions`.
- Campo **código de rastreio** visível somente quando o próximo status selecionado for `SHIPPED`.
- Checkbox **“Notificar cliente por e-mail”** (default ligado).
- Observações opcionais (`notes`).
- Submit via `PATCH` com `api.patch` (cookies `access_token`).
- Toasts de sucesso/erro; após sucesso, `invalidateQueries` do pedido e da árvore de listas.
- **Timeline** visual (`OrderStatusTimeline`): etapas `PAID` → `PROCESSING` → `SHIPPED` → `DELIVERED`, marcando concluídas conforme `order.status`.

---

## 1.5 Spec — E2E (`apps/web/e2e/admin/pedidos-operacional.spec.ts`)

1. Admin marca pedido **PAID** → **PROCESSING** (toast sucesso, timeline atualizada).
2. Admin marca **PROCESSING** → **SHIPPED** com código; verificar que Maildev recebeu nova mensagem (HTTP em `localhost:1080`).
3. Pedido **PENDING**: transição operacional para **SHIPPED** não aparece ou API retorna erro de transição / pagamento (assert de mensagem na UI ou lista vazia de transições).
4. Tentativa de **SHIPPED** com `trackingCode` só espaços → erro de validação (toast ou mensagem de obrigatoriedade).
5. **Cancelamento** com restauração de estoque: coberto preferencialmente em teste de serviço (Jest) com Prisma mockado; E2E documenta dependência de seed com estoque conhecido se existir.

---

## GET ` /admin/orders/:id/valid-transitions`

Response:

```json
{ "current": "PAID", "validNext": ["PROCESSING", "CANCELLED"] }
```

---

## ADENDO — Fixes pós-validação (2026-05-13)

### Fix B1+B2 — Labels PT-BR consistentes

Mapeamento canônico (frontend) para enum interno:

| Enum (banco/API) | Label PT-BR (UI)     |
| ---------------- | -------------------- |
| PENDING          | Aguardando pagamento |
| PAID             | Pago                 |
| PROCESSING       | Preparando envio     |
| SHIPPED          | Enviado              |
| DELIVERED        | Entregue             |
| CANCELLED        | Cancelado            |
| REFUNDED         | Reembolsado          |

Regra: TODO render de status em UI usa o label PT-BR. Nunca exibe enum raw.
Cria `apps/web/src/lib/orders/status-labels.ts` exportando função `getStatusLabel(status)`.
Aplica em: select de transições, timeline, badge de status, lista de pedidos.

### Fix B3 — Toast em todas operações

Toast verde "Status atualizado!" SEMPRE após sucesso de PATCH (não só DELIVERED).
Toast vermelho com mensagem específica em erro.

### Fix B4 — E-mail bonito estilo Mirak

Template HTML dos 3 e-mails (enviado, entregue, cancelado) com:

- Header com nome "FLOR DE MENINA" centralizado, fonte serifa, espaçamento entre letras (estilo Mirak)
- Conteúdo em card branco com borda sutil, sombra leve
- Cores: fundo bege claro (#f5f0ea), texto marrom escuro (#3d2817), accent dourado (#a87c4f)
- Botão CTA estilo Mirak (marrom escuro, sem border-radius forte, padding generoso)
- Footer com link WhatsApp + Instagram (se configurado) + endereço da loja
- Responsivo mobile

### Fix B5 — Breadcrumb não-clicável quando é raiz

Em `/admin/*`, o item "Admin" do breadcrumb não deve ser link se a rota atual é raiz do admin.
Ou: sempre não-clicável, é só ancestral textual.

Decisão: tornar "Admin" sempre texto cinza (não-link). Os filhos continuam links.

### Fix B6 — Select controlled

No `OrderStatusUpdater`, o `<select>` ou Select shadcn deve ter `value=""` default e onChange controlado.
Resolve warning React de uncontrolled→controlled.
