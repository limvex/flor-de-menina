'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { navItems } from './nav-config';

export function NavMenu() {
  const router = useRouter();

  return (
    <nav aria-label="Menu principal" className="hidden lg:flex items-center gap-8">
      {navItems.map((item) =>
        item.children ? (
          <DropdownMenu key={item.label}>
            <DropdownMenuTrigger className="flex items-center gap-1 font-sans text-xs font-medium tracking-[0.15em] uppercase text-flor-700 hover:text-flor-900 transition-colors focus-visible:outline-none cursor-default">
              {item.label}
              <ChevronDown className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-[180px]">
              {item.children.map((child) => (
                <DropdownMenuItem
                  key={child.href}
                  onClick={() => router.push(child.href)}
                  className="font-sans text-sm text-flor-700 cursor-pointer"
                >
                  {child.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link
            key={item.label}
            href={item.href!}
            className="group relative font-sans text-xs font-medium tracking-[0.15em] uppercase text-flor-700 hover:text-flor-900 transition-colors"
          >
            {item.label}
            <span className="absolute -bottom-1 left-0 h-px w-0 bg-flor-500 transition-all duration-200 group-hover:w-full" />
          </Link>
        ),
      )}
    </nav>
  );
}
