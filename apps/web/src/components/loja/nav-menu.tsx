'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { fetchCategoriesTree } from '@/lib/loja/categories-api';
import type { CategoryPublicDto } from '@flor/types';

interface NavMenuProps {
  isTransparent?: boolean;
}

export function NavMenu({ isTransparent = false }: NavMenuProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryPublicDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategoriesTree()
      .then(setCategories)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <nav aria-label="Menu principal" className="hidden lg:flex items-center gap-8">
        <Loader2
          className={`size-4 animate-spin ${isTransparent ? 'text-white/70' : 'text-flor-400'}`}
        />
      </nav>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  const linkClass = isTransparent
    ? 'text-white hover:text-white/70'
    : 'text-flor-700 hover:text-flor-900';

  return (
    <nav aria-label="Menu principal" className="hidden lg:flex items-center gap-8">
      {categories.map((cat) =>
        cat.children.length > 0 ? (
          <DropdownMenu key={cat.id}>
            <DropdownMenuTrigger
              className={`flex items-center gap-1 font-sans text-xs font-medium tracking-[0.15em] uppercase transition-colors focus-visible:outline-none cursor-default ${linkClass}`}
            >
              {cat.name}
              <ChevronDown className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-[180px]">
              {cat.children.map((child) => (
                <DropdownMenuItem
                  key={child.id}
                  onClick={() => router.push(`/categoria/${child.slug}`)}
                  className="font-sans text-sm text-flor-700 cursor-pointer"
                >
                  {child.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link
            key={cat.id}
            href={`/categoria/${cat.slug}`}
            className={`group relative font-sans text-xs font-medium tracking-[0.15em] uppercase transition-colors ${linkClass}`}
          >
            {cat.name}
            <span
              className={`absolute -bottom-1 left-0 h-px w-0 transition-all duration-200 group-hover:w-full ${
                isTransparent ? 'bg-white' : 'bg-flor-500'
              }`}
            />
          </Link>
        ),
      )}
    </nav>
  );
}
