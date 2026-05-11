'use client';

import { useEffect, useMemo, useState } from 'react';
import { CopyButton } from './copy-button';

interface Props {
  qrCodeBase64: string;
  copyPaste: string;
  expiresAtIso: string;
}

function qrSrc(base64: string): string {
  const trimmed = base64.trim();
  if (trimmed.startsWith('data:')) return trimmed;
  if (trimmed.startsWith('<svg')) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(trimmed)}`;
  }
  return `data:image/svg+xml;base64,${trimmed}`;
}

export function PixDisplay({ qrCodeBase64, copyPaste, expiresAtIso }: Props) {
  const expires = useMemo(() => new Date(expiresAtIso).getTime(), [expiresAtIso]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const remainingMs = Math.max(0, expires - now);
  const mm = Math.floor(remainingMs / 60000);
  const ss = Math.floor((remainingMs % 60000) / 1000);
  const expired = remainingMs <= 0;

  const src = qrSrc(qrCodeBase64);

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <div className="relative h-52 w-52 overflow-hidden rounded-lg border border-flor-200 bg-white p-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- QR vem como data URL do gateway */}
          <img src={src} alt="QR Code PIX" className="h-full w-full object-contain" />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-flor-600">Copia e cola</p>
        <div className="flex items-center gap-2 rounded-lg border border-flor-200 bg-flor-50 p-3">
          <code className="flex-1 break-all text-xs text-flor-800">{copyPaste}</code>
          <CopyButton text={copyPaste} disabled={!copyPaste} />
        </div>
      </div>

      <div
        className={`rounded-lg border px-4 py-3 text-center text-sm ${
          expired
            ? 'border-red-200 bg-red-50 text-red-800'
            : 'border-amber-200 bg-amber-50 text-amber-900'
        }`}
        role="status"
      >
        {expired ? (
          'PIX expirado. Gere um novo código na área do pedido.'
        ) : (
          <>
            Tempo restante:{' '}
            <span className="font-mono font-semibold">
              {String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
