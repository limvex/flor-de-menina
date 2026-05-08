'use client';

import { Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  productName: string;
}

export function ShareButton({ productName }: Props) {
  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: productName, url });
      } catch {
        // usuário cancelou
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado!');
    }
  };

  return (
    <button
      onClick={handleShare}
      className="h-14 px-4 rounded border border-stone-300 hover:border-stone-700 transition-colors flex items-center justify-center"
      aria-label="Compartilhar produto"
    >
      <Share2 className="h-5 w-5 text-stone-700" />
    </button>
  );
}
