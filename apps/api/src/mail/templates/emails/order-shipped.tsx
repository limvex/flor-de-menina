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

export interface OrderShippedProps {
  name: string;
  orderNumber: string;
  orderId: string;
  trackingCode: string;
  estimatedDays?: number;
  appUrl: string;
}

export function OrderShippedTemplate({
  name,
  orderNumber,
  orderId,
  trackingCode,
  estimatedDays,
  appUrl,
}: OrderShippedProps) {
  const trackingUrl = `https://www.linkcorreios.com.br/?id=${trackingCode}`;
  const orderUrl = `${appUrl}/conta/pedidos/${orderId}`;

  return (
    <BaseLayout
      previewText={`Seu pedido ${orderNumber} foi enviado! Código de rastreio: ${trackingCode}`}
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
        Seu pedido foi enviado!
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
        Olá, {name}! O pedido <strong>{orderNumber}</strong> saiu para entrega.
        Em breve você terá suas novas peças em mãos.
      </Text>

      <Section
        style={{
          backgroundColor: BEIGE_LIGHT,
          borderRadius: '6px',
          padding: '20px',
          marginBottom: '24px',
          textAlign: 'center' as const,
        }}
      >
        <Text
          style={{
            margin: '0 0 4px 0',
            fontSize: '12px',
            color: TEXT_MUTED,
            fontFamily: 'Arial, Helvetica, sans-serif',
            textTransform: 'uppercase' as const,
            letterSpacing: '1px',
          }}
        >
          Código de rastreio
        </Text>
        <Text
          style={{
            margin: '0 0 16px 0',
            fontSize: '20px',
            color: TEXT_DARK,
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontWeight: '700',
            letterSpacing: '2px',
          }}
        >
          {trackingCode}
        </Text>
        <BrandButton href={trackingUrl}>Rastrear pelos Correios</BrandButton>
      </Section>

      {estimatedDays && (
        <Text
          style={{
            margin: '0 0 24px 0',
            fontSize: '14px',
            color: TEXT_DARK,
            lineHeight: '1.6',
            fontFamily: 'Arial, Helvetica, sans-serif',
            textAlign: 'center' as const,
          }}
        >
          Prazo estimado de entrega: <strong>{estimatedDays} dias úteis</strong>
        </Text>
      )}

      <Text
        style={{
          margin: '0 0 24px 0',
          fontSize: '14px',
          color: TEXT_DARK,
          lineHeight: '1.6',
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        Você também pode acompanhar seu pedido diretamente na sua conta:
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
        Ou acesse:{' '}
        <Link href={trackingUrl} style={{ color: BROWN }}>
          {trackingUrl}
        </Link>
      </Text>
    </BaseLayout>
  );
}

export default OrderShippedTemplate;
