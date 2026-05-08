'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';

interface HeaderSearchProps {
  onClose: () => void;
}

export function HeaderSearch({ onClose }: HeaderSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = inputRef.current?.value.trim() ?? '';
    if (value) {
      router.push(`/buscar?q=${encodeURIComponent(value)}`);
      onClose();
    }
  }

  return (
    <div className="absolute inset-0 z-10 flex items-center bg-background px-4 lg:px-8">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-xl items-center gap-3 border-b border-flor-300 pb-1"
      >
        <Search className="h-4 w-4 shrink-0 text-flor-400" aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          placeholder="Buscar produtos..."
          className="flex-1 bg-transparent font-sans text-sm text-flor-800 placeholder:text-flor-400 focus:outline-none"
          onBlur={() => setTimeout(onClose, 150)}
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar busca"
          className="shrink-0 p-1 text-flor-400 hover:text-flor-700 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
