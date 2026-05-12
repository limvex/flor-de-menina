import * as React from 'react';
import { Section, Row, Column, Text, Hr } from '@react-email/components';
import { TEXT_DARK, TEXT_MUTED, BEIGE_LIGHT } from '../layouts/base-layout';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderItemsTableProps {
  items: OrderItem[];
  subtotal?: number;
  shippingCost?: number;
  discount?: number;
  total: number;
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function OrderItemsTable({
  items,
  subtotal,
  shippingCost,
  discount,
  total,
}: OrderItemsTableProps) {
  return (
    <Section
      style={{
        backgroundColor: BEIGE_LIGHT,
        borderRadius: '6px',
        padding: '16px 20px',
        marginBottom: '24px',
      }}
    >
      {/* Header */}
      <Row style={{ marginBottom: '10px' }}>
        <Column style={{ width: '60%' }}>
          <Text
            style={{
              margin: 0,
              fontSize: '12px',
              color: TEXT_MUTED,
              fontFamily: 'Arial, Helvetica, sans-serif',
              textTransform: 'uppercase' as const,
              letterSpacing: '1px',
            }}
          >
            Produto
          </Text>
        </Column>
        <Column style={{ width: '15%', textAlign: 'center' as const }}>
          <Text
            style={{
              margin: 0,
              fontSize: '12px',
              color: TEXT_MUTED,
              fontFamily: 'Arial, Helvetica, sans-serif',
            }}
          >
            Qtd
          </Text>
        </Column>
        <Column style={{ width: '25%', textAlign: 'right' as const }}>
          <Text
            style={{
              margin: 0,
              fontSize: '12px',
              color: TEXT_MUTED,
              fontFamily: 'Arial, Helvetica, sans-serif',
            }}
          >
            Valor
          </Text>
        </Column>
      </Row>

      <Hr style={{ borderColor: '#DDD0C2', margin: '0 0 10px 0' }} />

      {items.map((item, idx) => (
        <Row key={idx} style={{ marginBottom: '8px' }}>
          <Column style={{ width: '60%' }}>
            <Text
              style={{
                margin: 0,
                fontSize: '13px',
                color: TEXT_DARK,
                fontFamily: 'Arial, Helvetica, sans-serif',
              }}
            >
              {item.name}
            </Text>
          </Column>
          <Column style={{ width: '15%', textAlign: 'center' as const }}>
            <Text
              style={{
                margin: 0,
                fontSize: '13px',
                color: TEXT_DARK,
                fontFamily: 'Arial, Helvetica, sans-serif',
              }}
            >
              {item.quantity}
            </Text>
          </Column>
          <Column style={{ width: '25%', textAlign: 'right' as const }}>
            <Text
              style={{
                margin: 0,
                fontSize: '13px',
                color: TEXT_DARK,
                fontFamily: 'Arial, Helvetica, sans-serif',
              }}
            >
              {formatBRL(item.price * item.quantity)}
            </Text>
          </Column>
        </Row>
      ))}

      <Hr style={{ borderColor: '#DDD0C2', margin: '10px 0' }} />

      {subtotal !== undefined && (
        <Row style={{ marginBottom: '4px' }}>
          <Column style={{ width: '75%' }}>
            <Text
              style={{
                margin: 0,
                fontSize: '13px',
                color: TEXT_MUTED,
                fontFamily: 'Arial, Helvetica, sans-serif',
              }}
            >
              Subtotal
            </Text>
          </Column>
          <Column style={{ width: '25%', textAlign: 'right' as const }}>
            <Text
              style={{
                margin: 0,
                fontSize: '13px',
                color: TEXT_DARK,
                fontFamily: 'Arial, Helvetica, sans-serif',
              }}
            >
              {formatBRL(subtotal)}
            </Text>
          </Column>
        </Row>
      )}

      {shippingCost !== undefined && (
        <Row style={{ marginBottom: '4px' }}>
          <Column style={{ width: '75%' }}>
            <Text
              style={{
                margin: 0,
                fontSize: '13px',
                color: TEXT_MUTED,
                fontFamily: 'Arial, Helvetica, sans-serif',
              }}
            >
              Frete
            </Text>
          </Column>
          <Column style={{ width: '25%', textAlign: 'right' as const }}>
            <Text
              style={{
                margin: 0,
                fontSize: '13px',
                color: TEXT_DARK,
                fontFamily: 'Arial, Helvetica, sans-serif',
              }}
            >
              {shippingCost === 0 ? 'Grátis' : formatBRL(shippingCost)}
            </Text>
          </Column>
        </Row>
      )}

      {discount !== undefined && discount > 0 && (
        <Row style={{ marginBottom: '4px' }}>
          <Column style={{ width: '75%' }}>
            <Text
              style={{
                margin: 0,
                fontSize: '13px',
                color: '#6B9E5E',
                fontFamily: 'Arial, Helvetica, sans-serif',
              }}
            >
              Desconto
            </Text>
          </Column>
          <Column style={{ width: '25%', textAlign: 'right' as const }}>
            <Text
              style={{
                margin: 0,
                fontSize: '13px',
                color: '#6B9E5E',
                fontFamily: 'Arial, Helvetica, sans-serif',
              }}
            >
              -{formatBRL(discount)}
            </Text>
          </Column>
        </Row>
      )}

      <Hr style={{ borderColor: '#DDD0C2', margin: '8px 0' }} />

      <Row>
        <Column style={{ width: '75%' }}>
          <Text
            style={{
              margin: 0,
              fontSize: '15px',
              color: TEXT_DARK,
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontWeight: '600',
            }}
          >
            Total
          </Text>
        </Column>
        <Column style={{ width: '25%', textAlign: 'right' as const }}>
          <Text
            style={{
              margin: 0,
              fontSize: '15px',
              color: TEXT_DARK,
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontWeight: '600',
            }}
          >
            {formatBRL(total)}
          </Text>
        </Column>
      </Row>
    </Section>
  );
}
