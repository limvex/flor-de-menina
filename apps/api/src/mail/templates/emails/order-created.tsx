import * as React from 'react';
import { Text, Section, Link } from '@react-email/components';
import {
  BaseLayout,
  TEXT_DARK,
  TEXT_MUTED,
  BEIGE_LIGHT,
  BROWN,
} from '../layouts/base-layout';
import { BrandButton } from '../components/brand-button';
import { OrderItemsTable } from '../components/order-items-table';

export interface OrderCreatedProps {
  name: string;
  orderNumber: string;
  orderId: string;
  paymentMethod: 'PIX' | 'CREDIT_CARD';
  pixCopyPaste?: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  appUrl: string;
}

export function OrderCreatedTemplate({
  name,
  orderNumber,
  orderId,
  paymentMethod,
  pixCopyPaste,
  items,
  subtotal,
  shippingCost,
  discount,
  total,
  appUrl,
}: OrderCreatedProps) {
  const orderUrl = `${appUrl}/conta/pedidos/${orderId}`;

  return (
    <BaseLayout
      previewText={`Pedido ${orderNumber} recebido! Aguardando pagamento.`}
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
        Olá, {name}!
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
        Recebemos seu pedido <strong>{orderNumber}</strong>!
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
        {paymentMethod === 'PIX'
          ? 'Para confirmar seu pedido, realize o pagamento via PIX no app do seu banco. Você tem 30 minutos para pagar.'
          : 'Estamos processando seu pagamento. Você receberá uma confirmação em instantes.'}
      </Text>

      {paymentMethod === 'PIX' && pixCopyPaste && (
        <Section
          style={{
            backgroundColor: BEIGE_LIGHT,
            borderRadius: '6px',
            padding: '16px 20px',
            marginBottom: '24px',
            textAlign: 'center' as const,
          }}
        >
          <Text
            style={{
              margin: '0 0 8px 0',
              fontSize: '13px',
              color: TEXT_MUTED,
              fontFamily: 'Arial, Helvetica, sans-serif',
            }}
          >
            Copie o código PIX abaixo:
          </Text>
          <Text
            style={{
              margin: '0 0 8px 0',
              fontSize: '12px',
              color: TEXT_DARK,
              fontFamily: 'Arial, Helvetica, sans-serif',
              wordBreak: 'break-all' as const,
              backgroundColor: '#FFFFFF',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #DDD0C2',
            }}
          >
            {pixCopyPaste}
          </Text>
          <Text
            style={{
              margin: 0,
              fontSize: '12px',
              color: TEXT_MUTED,
              fontFamily: 'Arial, Helvetica, sans-serif',
            }}
          >
            Ou use a opção "PIX Copia e Cola" no seu banco
          </Text>
        </Section>
      )}

      <OrderItemsTable
        items={items}
        subtotal={subtotal}
        shippingCost={shippingCost}
        discount={discount}
        total={total}
      />

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

export default OrderCreatedTemplate;
