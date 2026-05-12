import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Row,
  Column,
  Text,
  Hr,
  Link,
  Preview,
} from '@react-email/components';

interface BaseLayoutProps {
  previewText: string;
  children: React.ReactNode;
}

const BROWN = '#755E4E';
const BROWN_DARK = '#6B4F3A';
const BEIGE_LIGHT = '#F0E8DC';
const TEXT_DARK = '#3F2D22';
const TEXT_MUTED = '#9E8B7D';

export function BaseLayout({ previewText, children }: BaseLayoutProps) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>{[previewText]}</Preview>
      <Body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: '#FAFAFA',
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        <Container
          style={{
            maxWidth: '600px',
            margin: '0 auto',
            backgroundColor: '#FAFAFA',
            padding: '32px 16px',
          }}
        >
          {/* Header */}
          <Section
            style={{
              backgroundColor: BROWN_DARK,
              padding: '28px 40px',
              textAlign: 'center' as const,
              borderRadius: '8px 8px 0 0',
            }}
          >
            <Text
              style={{
                margin: 0,
                color: '#FAF6F0',
                fontSize: '22px',
                fontWeight: '400',
                letterSpacing: '3px',
                fontFamily: 'Georgia, "Times New Roman", serif',
              }}
            >
              FLOR DE MENINA
            </Text>
          </Section>

          {/* Divider */}
          <Section style={{ backgroundColor: BEIGE_LIGHT, padding: '4px 0' }} />

          {/* Body */}
          <Section
            style={{
              backgroundColor: '#FFFFFF',
              padding: '36px 40px',
              borderRadius: '0 0 8px 8px',
            }}
          >
            {children}
          </Section>

          {/* Footer */}
          <Section
            style={{ padding: '24px 40px', textAlign: 'center' as const }}
          >
            <Hr style={{ borderColor: '#E5DDD5', margin: '0 0 20px 0' }} />
            <Row>
              <Column>
                <Text
                  style={{
                    margin: '0 0 6px 0',
                    color: TEXT_MUTED,
                    fontSize: '12px',
                  }}
                >
                  Flor de Menina · Maceió, AL
                </Text>
                <Text
                  style={{
                    margin: '0 0 6px 0',
                    color: TEXT_MUTED,
                    fontSize: '12px',
                  }}
                >
                  <Link
                    href="https://instagram.com/flordemeninaoficial"
                    style={{ color: BROWN, textDecoration: 'none' }}
                  >
                    @flordemeninaoficial
                  </Link>{' '}
                  ·{' '}
                  <Link
                    href="mailto:contato@flordemenina.store"
                    style={{ color: BROWN, textDecoration: 'none' }}
                  >
                    contato@flordemenina.store
                  </Link>
                </Text>
                <Text
                  style={{ margin: 0, color: TEXT_MUTED, fontSize: '11px' }}
                >
                  Você está recebendo este e-mail porque é cliente Flor de
                  Menina.
                </Text>
              </Column>
            </Row>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export { BROWN, BROWN_DARK, BEIGE_LIGHT, TEXT_DARK, TEXT_MUTED };
