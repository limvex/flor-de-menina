'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface Props {
  text: string;
  disabled?: boolean;
}

export function CopyButton({ text, disabled }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleCopy}
      className="flex-shrink-0 rounded p-1 hover:bg-flor-200 disabled:opacity-40 transition-colors"
      aria-label="Copiar código PIX"
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <Copy className="h-4 w-4 text-flor-600" />
      )}
    </button>
  );
}
