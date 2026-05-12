import * as React from 'react';
import { Text, Section } from '@react-email/components';
import { BaseLayout, TEXT_DARK, TEXT_MUTED } from '../layouts/base-layout';
import { BrandButton } from '../components/brand-button';

export interface OrderDeliveredProps {
  name: string;
  orderNumber: string;
  orderId: string;
  appUrl: string;
}

export function OrderDeliveredTemplate({
  name,
  orderNumber,
  orderId,
  appUrl,
}: OrderDeliveredProps) {
  const orderUrl = `${appUrl}/conta/pedidos/${orderId}`;

  return (
    <BaseLayout
      previewText={`Sua entrega chegou! Esperamos que você ame suas novas peças.`}
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
        Sua entrega chegou!
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
        Olá, {name}! O pedido <strong>{orderNumber}</strong> foi entregue.
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
        Esperamos que você ame suas novas peças tanto quanto nós amamos curar
        cada uma delas para você.
      </Text>

      <Text
        style={{
          margin: '0 0 24px 0',
          fontSize: '14px',
          color: TEXT_DARK,
          lineHeight: '1.6',
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        Nos próximos dias, enviaremos um convite para você avaliar sua compra.
        Sua opinião nos ajuda muito a melhorar e a ajudar outras clientes.
      </Text>

      <Section style={{ textAlign: 'center' as const, margin: '0 0 16px 0' }}>
        <BrandButton href={orderUrl}>Ver meu pedido</BrandButton>
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
        Algum problema? Responda este e-mail ou acesse Meus Pedidos para
        solicitar suporte.
      </Text>
    </BaseLayout>
  );
}

export default OrderDeliveredTemplate;
