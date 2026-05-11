'use client';

import { useEffect, useMemo, useState } from 'react';
import { CopyButton } from './copy-button';

interface Props {
  qrCodeBase64: string;
  copyPaste: string;
  expiresAtIso: string;
}

/** Monta `src` válido para `<img>`: MP costuma mandar PNG em base64 sem prefixo `data:`. */
function qrSrc(raw: string): string {
  const trimmed = raw.trim().replace(/\s/g, '');
  if (!trimmed) return '';
  if (trimmed.startsWith('data:')) return trimmed;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('<svg')) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(trimmed)}`;
  }
  // PNG (Mercado Pago e a maioria dos gateways)
  if (trimmed.startsWith('iVBOR')) {
    return `data:image/png;base64,${trimmed}`;
  }
  if (trimmed.startsWith('/9j/')) {
    return `data:image/jpeg;base64,${trimmed}`;
  }
  // Mock: SVG serializado em base64 (ex.: começa com PHN2Zy = "<svg")
  return `data:image/svg+xml;base64,${trimmed}`;
}

export function PixDisplay({ qrCodeBase64, copyPaste, expiresAtIso }: Props) {
  const expiresMs = useMemo(() => {
    const t = new Date(expiresAtIso).getTime();
    return Number.isFinite(t) ? t : NaN;
  }, [expiresAtIso]);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const remainingMs =
    Number.isFinite(expiresMs) && expiresMs > 0 ? Math.max(0, expiresMs - now) : 0;
  const mm = Math.floor(remainingMs / 60000);
  const ss = Math.floor((remainingMs % 60000) / 1000);
  const expired = Number.isFinite(expiresMs) && expiresMs > 0 && remainingMs <= 0;
  const showTimer = Number.isFinite(expiresMs) && expiresMs > 0;

  const src = qrSrc(qrCodeBase64);

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <div className="relative h-52 w-52 overflow-hidden rounded-lg border border-flor-200 bg-white p-2">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element -- QR vem como data URL ou URL do gateway
            <img src={src} alt="QR Code PIX" className="h-full w-full object-contain" />
          ) : (
            <div className="flex h-full items-center justify-center text-center text-xs text-flor-500">
              QR indisponível — use o copia e cola abaixo.
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-flor-600">Copia e cola</p>
        <div className="flex items-center gap-2 rounded-lg border border-flor-200 bg-flor-50 p-3">
          <code className="flex-1 break-all text-xs text-flor-800">{copyPaste}</code>
          <CopyButton text={copyPaste} disabled={!copyPaste} />
        </div>
      </div>

      {showTimer && (
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
      )}
    </div>
  );
}
