import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-stone-500">
      <Link href="/" className="hover:text-stone-900 transition-colors">
        Início
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3" />
          {item.href ? (
            <Link href={item.href} className="hover:text-stone-900 transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-stone-900">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
