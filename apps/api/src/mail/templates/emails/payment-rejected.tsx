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

export interface PaymentRejectedProps {
  name: string;
  orderNumber: string;
  orderId: string;
  reason?: string;
  appUrl: string;
}

export function PaymentRejectedTemplate({
  name,
  orderNumber,
  orderId,
  reason,
  appUrl,
}: PaymentRejectedProps) {
  const retryUrl = `${appUrl}/conta/pedidos/${orderId}`;

  return (
    <BaseLayout
      previewText={`Problema no pagamento do pedido ${orderNumber}. Veja como resolver.`}
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
        Tivemos um problema com o pagamento do pedido{' '}
        <strong>{orderNumber}</strong>.
      </Text>

      {reason && (
        <Section
          style={{
            backgroundColor: BEIGE_LIGHT,
            borderRadius: '6px',
            padding: '14px 20px',
            margin: '0 0 24px 0',
          }}
        >
          <Text
            style={{
              margin: 0,
              fontSize: '14px',
              color: TEXT_DARK,
              fontFamily: 'Arial, Helvetica, sans-serif',
            }}
          >
            <strong>Motivo:</strong> {reason}
          </Text>
        </Section>
      )}

      {!reason && (
        <Text
          style={{
            margin: '0 0 24px 0',
            fontSize: '15px',
            color: TEXT_DARK,
            lineHeight: '1.6',
            fontFamily: 'Arial, Helvetica, sans-serif',
          }}
        >
          Isso pode acontecer por saldo insuficiente, limite excedido ou dados
          incorretos do cartão. Você pode tentar novamente com outro método de
          pagamento.
        </Text>
      )}

      <Text
        style={{
          margin: '0 0 24px 0',
          fontSize: '15px',
          color: TEXT_DARK,
          lineHeight: '1.6',
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        Seus produtos foram reservados por mais alguns minutos. Clique abaixo
        para tentar novamente:
      </Text>

      <Section style={{ textAlign: 'center' as const, margin: '0 0 24px 0' }}>
        <BrandButton href={retryUrl}>Tentar novamente</BrandButton>
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
        Precisa de ajuda? Responda este e-mail ou acesse{' '}
        <Link
          href={`${appUrl}/conta/pedidos/${orderId}`}
          style={{ color: BROWN }}
        >
          Meus pedidos
        </Link>
      </Text>
    </BaseLayout>
  );
}

export default PaymentRejectedTemplate;
