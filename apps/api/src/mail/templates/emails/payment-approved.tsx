import * as React from 'react';
import { Text, Section, Link } from '@react-email/components';
import {
  BaseLayout,
  TEXT_DARK,
  TEXT_MUTED,
  BROWN,
} from '../layouts/base-layout';
import { BrandButton } from '../components/brand-button';
import { OrderItemsTable } from '../components/order-items-table';

export interface PaymentApprovedProps {
  name: string;
  orderNumber: string;
  orderId: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  appUrl: string;
}

export function PaymentApprovedTemplate({
  name,
  orderNumber,
  orderId,
  items,
  total,
  appUrl,
}: PaymentApprovedProps) {
  const orderUrl = `${appUrl}/conta/pedidos/${orderId}`;

  return (
    <BaseLayout
      previewText={`Pagamento confirmado! Pedido ${orderNumber} em preparação.`}
    >
      <Text
        style={{
          margin: '0 0 8px 0',
          fontSize: '22px',
          color: TEXT_DARK,
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontWeight: '400',
        }}
      >
        Pagamento confirmado!
      </Text>

      <Text
        style={{
          margin: '0 0 4px 0',
          fontSize: '15px',
          color: TEXT_DARK,
          lineHeight: '1.6',
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        Olá, {name}! O pagamento do pedido <strong>{orderNumber}</strong> foi
        aprovado.
      </Text>

      <Text
        style={{
          margin: '0 0 24px 0',
          fontSize: '15px',
          color: TEXT_DARK,
          lineHeight: '1.6',
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        Já estamos preparando suas peças com carinho. Você receberá um novo
        e-mail assim que seu pedido for enviado.
      </Text>

      <OrderItemsTable items={items} total={total} />

      <Text
        style={{
          margin: '0 0 24px 0',
          fontSize: '14px',
          color: TEXT_DARK,
          lineHeight: '1.6',
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        <strong>Próximos passos:</strong> Assim que seu pedido for separado e
        enviado, você receberá o código de rastreio por e-mail.
      </Text>

      <Section style={{ textAlign: 'center' as const, margin: '0 0 16px 0' }}>
        <BrandButton href={orderUrl}>Acompanhar pedido</BrandButton>
      </Section>

      <Text
        style={{
          margin: 0,
          fontSize: '13px',
          color: TEXT_MUTED,
          fontFamily: 'Arial, Helvetica, sans-serif',
          textAlign: 'center' as const,
        }}
      >
        Ou acesse:{' '}
        <Link href={orderUrl} style={{ color: BROWN }}>
          {orderUrl}
        </Link>
      </Text>
    </BaseLayout>
  );
}

export default PaymentApprovedTemplate;
