import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

type AppErrorScreenProps = {
  title?: string;
  description: string;
  onReset?: () => void;
  resetLabel?: string;
  lojaHref?: string;
  lojaLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function AppErrorScreen({
  title = 'Algo deu errado',
  description,
  onReset,
  resetLabel = 'Tentar novamente',
  lojaHref = '/',
  lojaLabel = 'Voltar à loja',
  secondaryHref,
  secondaryLabel,
}: AppErrorScreenProps) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 py-20 text-center">
      <div className="mb-5 rounded-full bg-flor-100 p-4">
        <AlertCircle className="h-9 w-9 text-flor-500" aria-hidden />
      </div>
      <h1 className="font-serif text-2xl tracking-wide text-flor-800">{title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-flor-600">{description}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {onReset && (
          <Button type="button" variant="outline" onClick={onReset}>
            {resetLabel}
          </Button>
        )}
        <Button render={<Link href={lojaHref} />} nativeButton={false}>
          {lojaLabel}
        </Button>
        {secondaryHref && secondaryLabel && (
          <Button variant="ghost" render={<Link href={secondaryHref} />} nativeButton={false}>
            {secondaryLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
