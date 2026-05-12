# Spec — Dashboard Admin (#23)

Fonte de verdade para implementação, testes e aceite. Issue: Dashboard inicial do admin (métricas, gráficos, atalhos, alertas).

## User stories

1. Como dona (admin), ao abrir o painel em `/admin` → `/admin/dashboard`, quero ver em poucos segundos receita, quantidade de pedidos pagos, ticket médio e tendência de receita no período escolhido.
2. Como admin, quero filtrar por hoje, últimos 7 dias, últimos 30 dias ou intervalo customizado para entender o desempenho.
3. Como admin, quero ver os 5 produtos mais vendidos (por quantidade) no período e os 10 pedidos mais recentes com link para o detalhe.
4. Como admin, quero alertas visíveis só quando houver estoque baixo, reviews pendentes ou pedidos pós-pagamento aguardando operação, com atalhos para agir.
5. Como admin, quero atalhos para novo produto, lista de pedidos e configuração de frete.

## Glossário

- **Pedido de negócio (KPI / gráfico / top produtos)**: pedido com `status` em `PAID`, `PROCESSING`, `SHIPPED`, `DELIVERED`. Exclui `PENDING`, `CANCELLED`, `REFUNDED`.
- **Receita (período)**: soma de `Order.total` (decimal) desses pedidos cujo `createdAt` está na janela `[from, to]` (inclusivo nos extremos conforme implementação UTC abaixo).
- **Pedidos (KPI)**: contagem de pedidos de negócio no período.
- **Ticket médio**: `receita / pedidos` quando `pedidos > 0`; caso contrário `0`.
- **Top 5 produtos**: entre itens (`OrderItem`) de pedidos de negócio no período, agrupar por `productId`, ordenar por `SUM(quantity)` decrescente, desempate por `SUM(subtotal)` decrescente; retornar nome do produto (snapshot `productName` do item ou join atual — usar `productName` do primeiro item do grupo por simplicidade).

## Fuso e janelas de data

- **Timezone de referência**: `America/Maceió` (Alagoas; offset fixo UTC−3, sem DST).
- **Preset `today`**: dia civil atual em Maceió, `[00:00, 23:59:59.999]` desse dia convertidos para instantes UTC.
- **Preset `7d`**: últimos 7 dias civis **incluindo hoje** em Maceió (hoje + 6 dias anteriores).
- **Preset `30d`**: idem com 30 dias incluindo hoje.
- **Preset `custom`**: query `from` e `to` como **datas** `YYYY-MM-DD` em Maceió (início do `from` e fim do `to`). Validação: `from <= to`; intervalo máximo **366** dias.
- **Decisão produto — taxa de conversão**: **não** exibir card de conversão (visitas → pedidos) até existir fonte confiável (ex.: GA4 ou issue dedicada de analytics). Checklist da issue #23 pode divergir; prevalece esta spec.

## Alertas (somente quando aplicável)

| Alerta                | Regra                                                                                                                                                                                                                                                                                       | Link                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Estoque baixo         | Mesmo critério conceitual da lista admin de estoque com filtro `status=low`: produto não deletado, com variante ativa, não todas as variantes ativas com `stock <= 0`, e existe variante ativa com `0 < stock < LOW_STOCK_THRESHOLD` (5). Contagem = número de **produtos** nessa situação. | `/admin/estoque` com filtro de status baixo na UI (query `status=low` se suportado). |
| Reviews pendentes     | `COUNT(Review WHERE status = PENDING) > 0`.                                                                                                                                                                                                                                                 | `/admin/reviews`                                                                     |
| Pedidos não atendidos | Pedidos com `status IN (PAID, PROCESSING)` (pago ou em separação, ainda não enviados).                                                                                                                                                                                                      | `/admin/pedidos?status=PAID` ou lista filtrável — mínimo: `/admin/pedidos`.          |

UI: cada alerta só é renderizado se o contador correspondente for `> 0`.

## Contrato HTTP

### `GET /admin/dashboard/summary`

**Auth**: cookie `access_token`; guards `JwtAuthGuard` + `RolesGuard`; roles `ADMIN`, `OPERATOR`.

**Query**:

| Parâmetro | Tipo                                 | Obrigatório        | Descrição                                                 |
| --------- | ------------------------------------ | ------------------ | --------------------------------------------------------- |
| `preset`  | `today` \| `7d` \| `30d` \| `custom` | sim\*              | \*Se `custom`, `from` e `to` obrigatórios (`YYYY-MM-DD`). |
| `from`    | string                               | se `preset=custom` | Data inicial (Maceió).                                    |
| `to`      | string                               | se `preset=custom` | Data final (Maceió).                                      |

**200** — JSON:

```json
{
  "period": {
    "preset": "7d",
    "from": "2026-05-06T03:00:00.000Z",
    "to": "2026-05-13T02:59:59.999Z"
  },
  "kpis": { "revenue": 0, "ordersCount": 0, "averageTicket": 0 },
  "revenueByDay": [{ "date": "2026-05-06", "revenue": 0 }],
  "topProducts": [{ "productId": "…", "name": "…", "unitsSold": 0, "revenue": 0 }],
  "recentOrders": [
    {
      "id": "…",
      "number": "…",
      "status": "PAID",
      "total": 0,
      "createdAt": "…",
      "customerName": "…"
    }
  ],
  "alerts": { "lowStockCount": 0, "pendingReviewsCount": 0, "unattendedOrdersCount": 0 }
}
```

- `revenue`, `averageTicket`, valores monetários em **número** (reais, não centavos).
- `revenueByDay`: um ponto por dia civil no intervalo (inclusive); dias sem receita com `revenue: 0`.

**400**: intervalo inválido ou `preset` desconhecido.  
**401/403**: não autenticado ou sem papel.

### `GET /admin/orders`

Query: `page`, `pageSize` (default 1 e 20), `status` opcional (enum `OrderStatus`).

Resposta: `{ items, total, page, pageSize }` com itens resumidos (id, number, status, total, createdAt, customer email/name).

### `GET /admin/orders/:id`

Detalhe read-only: pedido + itens + payment + shipping + usuário.

**404**: não encontrado.

### `GET /admin/reviews`

Query: `status` (default `PENDING`), `page`, `pageSize`.

### `PATCH /admin/reviews/:id`

Body: `{ "status": "APPROVED" \| "REJECTED", "rejectionReason"?: string }`. Requer `ADMIN` ou `OPERATOR`; grava `moderatedById`, `moderatedAt`.

## Contrato UI (web)

- **Dashboard**: client component com React Query; estados loading / erro / vazio (KPIs zerados ainda mostram 0).
- **Período**: botões ou tabs Hoje | 7 dias | 30 dias; custom com dois `<input type="date">` + aplicar.
- **Gráfico**: Recharts `ResponsiveContainer` + altura mínima ~240px; eixo Y formatado BRL compacto.
- **Mobile**: grid de cards 1 col; gráfico scroll horizontal permitido se necessário; filtros empilhados.

## Matriz de testes

| Área                                | Automatizado                                         | Manual                              |
| ----------------------------------- | ---------------------------------------------------- | ----------------------------------- |
| Agregação KPI / ticket zero divisão | Jest `AdminDashboardService` (mock Prisma)           | —                                   |
| Intervalo custom inválido           | Jest controller ou service                           | —                                   |
| Lista pedidos admin                 | Jest `AdminOrdersService`                            | Smoke lista + detalhe               |
| Moderar review                      | Jest opcional                                        | Fluxo approve/reject                |
| Dashboard E2E                       | Playwright login + `/admin/dashboard` + troca preset | Visual mobile 375px                 |
| Alertas condicionais                | API retorna zeros; UI não mostra banners             | Seed com low stock / pending review |

## Implementação técnica (referência)

- Agregações diárias e top produtos: podem ser feitas em memória a partir de `findMany` filtrado no Nest, desde que documentado; volume esperado inicial baixo.
- Tabelas Prisma: `"Product"`, `"ProductVariant"`, `"Order"`, `"OrderItem"`, `"Review"`, `"User"`.
