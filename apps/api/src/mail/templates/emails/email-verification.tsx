import * as React from 'react';
import { Text, Section } from '@react-email/components';
import { BaseLayout, TEXT_DARK, TEXT_MUTED } from '../layouts/base-layout';
import { BrandButton } from '../components/brand-button';

export interface EmailVerificationProps {
  name: string;
  verificationLink: string;
}

export function EmailVerificationTemplate({
  name,
  verificationLink,
}: EmailVerificationProps) {
  return (
    <BaseLayout previewText="Confirme seu e-mail para ativar sua conta na Flor de Menina">
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
        Obrigada por se cadastrar na Flor de Menina. Para começar a explorar
        nossas peças, confirme seu e-mail clicando no botão abaixo:
      </Text>

      <Section style={{ textAlign: 'center' as const, margin: '0 0 28px 0' }}>
        <BrandButton href={verificationLink}>Confirmar meu e-mail</BrandButton>
      </Section>

      <Text
        style={{
          margin: '0 0 6px 0',
          fontSize: '13px',
          color: TEXT_MUTED,
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        Este link é válido por 24 horas. Se você não se cadastrou na Flor de
        Menina, ignore este e-mail.
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
        Ou copie e cole no seu navegador: {verificationLink}
      </Text>
    </BaseLayout>
  );
}

export default EmailVerificationTemplate;
