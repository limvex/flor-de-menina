'use client';

interface SeoPreviewProps {
  siteLabel?: string;
  title: string;
  description: string;
}

const SITE = 'https://flordemenina.store';

export function SeoPreview({ siteLabel = SITE, title, description }: SeoPreviewProps) {
  const safeTitle = title.trim() || 'Título da página';
  const safeDesc =
    description.trim() ||
    'A descrição aparecerá aqui quando você preencher o campo meta descrição.';

  return (
    <div className="rounded-lg border border-flor-100 bg-flor-50/80 p-4 text-left">
      <p className="text-xs text-flor-500 mb-2">Prévia no Google</p>
      <p className="text-sm text-flor-700 truncate">{siteLabel}</p>
      <p className="text-lg text-flor-600 hover:underline truncate cursor-default">{safeTitle}</p>
      <p className="text-sm text-flor-600 line-clamp-3 leading-snug">{safeDesc}</p>
    </div>
  );
}
