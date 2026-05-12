import * as React from 'react';
import { Text, Section, Row, Column, Img } from '@react-email/components';
import { BaseLayout, TEXT_DARK, TEXT_MUTED } from '../layouts/base-layout';
import { BrandButton } from '../components/brand-button';

export interface ReviewInvitationItem {
  name: string;
  imageUrl?: string;
}

export interface ReviewInvitationProps {
  name: string;
  orderNumber: string;
  orderId: string;
  items: ReviewInvitationItem[];
  appUrl: string;
}

export function ReviewInvitationTemplate({
  name,
  orderNumber,
  orderId,
  items,
  appUrl,
}: ReviewInvitationProps) {
  const reviewUrl = `${appUrl}/conta/pedidos/${orderId}/avaliar`;

  return (
    <BaseLayout previewText="Como foi sua experiência? Sua opinião nos ajuda muito!">
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
        Esperamos que suas peças do pedido <strong>{orderNumber}</strong> já
        tenham chegado!
      </Text>

      <Text
        style={{
          margin: '0 0 8px 0',
          fontSize: '15px',
          color: TEXT_DARK,
          lineHeight: '1.6',
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        Como foi a experiência? Sua opinião nos ajuda muito a melhorar e a
        orientar outras clientes.
      </Text>

      <Text
        style={{
          margin: '0 0 24px 0',
          fontSize: '13px',
          color: TEXT_MUTED,
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontStyle: 'italic',
        }}
      >
        Se ainda não recebeu, ignore este e-mail — vamos te lembrar em breve.
      </Text>

      {items.length > 0 && (
        <Section style={{ marginBottom: '24px' }}>
          <Row>
            {items.slice(0, 3).map((item, idx) => (
              <Column
                key={idx}
                style={{
                  width: `${Math.floor(100 / Math.min(items.length, 3))}%`,
                  paddingRight: '8px',
                }}
              >
                {item.imageUrl && (
                  <Img
                    src={item.imageUrl}
                    alt={item.name}
                    width="160"
                    style={{
                      borderRadius: '4px',
                      display: 'block',
                      width: '100%',
                    }}
                  />
                )}
                <Text
                  style={{
                    margin: '6px 0 0 0',
                    fontSize: '12px',
                    color: TEXT_MUTED,
                    fontFamily: 'Arial, Helvetica, sans-serif',
                    textAlign: 'center' as const,
                  }}
                >
                  {item.name}
                </Text>
              </Column>
            ))}
          </Row>
        </Section>
      )}

      <Section style={{ textAlign: 'center' as const, margin: '0 0 16px 0' }}>
        <BrandButton href={reviewUrl}>Avaliar minhas peças</BrandButton>
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
        Leva menos de 2 minutos e ajuda muito a comunidade Flor de Menina.
      </Text>
    </BaseLayout>
  );
}

export default ReviewInvitationTemplate;
