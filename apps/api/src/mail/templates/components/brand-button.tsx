import * as React from 'react';
import { Button } from '@react-email/components';
import { BROWN_DARK } from '../layouts/base-layout';

interface BrandButtonProps {
  href: string;
  children: React.ReactNode;
}

export function BrandButton({ href, children }: BrandButtonProps) {
  return (
    <Button
      href={href}
      style={{
        backgroundColor: BROWN_DARK,
        color: '#FAF6F0',
        padding: '14px 32px',
        borderRadius: '4px',
        fontSize: '14px',
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontWeight: '400',
        letterSpacing: '1px',
        textDecoration: 'none',
        display: 'inline-block',
      }}
    >
      {children}
    </Button>
  );
}
