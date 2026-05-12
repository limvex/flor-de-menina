import * as React from 'react';
import { Row, Column, Text } from '@react-email/components';
import { TEXT_DARK, TEXT_MUTED } from '../layouts/base-layout';

interface InfoRowProps {
  label: string;
  value: string;
}

export function InfoRow({ label, value }: InfoRowProps) {
  return (
    <Row style={{ marginBottom: '8px' }}>
      <Column style={{ width: '40%' }}>
        <Text
          style={{
            margin: 0,
            fontSize: '13px',
            color: TEXT_MUTED,
            fontFamily: 'Arial, Helvetica, sans-serif',
          }}
        >
          {label}
        </Text>
      </Column>
      <Column style={{ width: '60%' }}>
        <Text
          style={{
            margin: 0,
            fontSize: '13px',
            color: TEXT_DARK,
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontWeight: '500',
          }}
        >
          {value}
        </Text>
      </Column>
    </Row>
  );
}
