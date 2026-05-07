import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  backHref?: string;
}

export function AdminPageHeader({ title, description, actions, backHref }: AdminPageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        {backHref && (
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 text-xs text-flor-400 hover:text-flor-700 mb-1 transition-colors"
          >
            <ChevronLeft className="size-3" />
            Voltar
          </Link>
        )}
        <h1 className="text-xl font-semibold text-flor-800">{title}</h1>
        {description && <p className="mt-0.5 text-sm text-flor-500">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
