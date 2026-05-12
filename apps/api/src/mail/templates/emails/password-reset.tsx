import * as React from 'react';
import { Text, Section } from '@react-email/components';
import { BaseLayout, TEXT_DARK, TEXT_MUTED } from '../layouts/base-layout';
import { BrandButton } from '../components/brand-button';

export interface PasswordResetProps {
  name: string;
  resetLink: string;
}

export function PasswordResetTemplate({ name, resetLink }: PasswordResetProps) {
  return (
    <BaseLayout previewText="Redefinição de senha solicitada para sua conta Flor de Menina">
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
          margin: '0 0 24px 0',
          fontSize: '15px',
          color: TEXT_DARK,
          lineHeight: '1.6',
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        Recebemos uma solicitação para redefinir a senha da sua conta. Clique no
        botão abaixo para criar uma nova senha:
      </Text>

      <Section style={{ textAlign: 'center' as const, margin: '0 0 28px 0' }}>
        <BrandButton href={resetLink}>Criar nova senha</BrandButton>
      </Section>

      <Text
        style={{
          margin: '0 0 6px 0',
          fontSize: '13px',
          color: TEXT_MUTED,
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        Este link é válido por 1 hora. Se você não solicitou a redefinição,
        ignore este e-mail — sua senha permanece a mesma.
      </Text>

      <Text
        style={{
          margin: 0,
          fontSize: '12px',
          color: TEXT_MUTED,
          fontFamily: 'Arial, Helvetica, sans-serif',
          wordBreak: 'break-all' as const,
        }}
      >
        Ou copie e cole no seu navegador: {resetLink}
      </Text>
    </BaseLayout>
  );
}

export default PasswordResetTemplate;
