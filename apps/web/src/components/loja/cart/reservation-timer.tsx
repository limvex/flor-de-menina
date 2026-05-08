'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  reservedUntil: string;
  onExpired?: () => void;
  className?: string;
}

export function ReservationTimer({ reservedUntil, onExpired, className }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(() => {
    return Math.max(0, Math.floor((new Date(reservedUntil).getTime() - Date.now()) / 1000));
  });

  useEffect(() => {
    if (secondsLeft <= 0) {
      onExpired?.();
      return;
    }

    const id = setInterval(() => {
      setSecondsLeft((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(id);
          onExpired?.();
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [reservedUntil, onExpired, secondsLeft]);

  if (secondsLeft <= 0) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const colorClass =
    secondsLeft > 300 ? 'text-emerald-600' : secondsLeft > 120 ? 'text-amber-500' : 'text-red-500';

  return (
    <span
      aria-live="polite"
      className={cn('inline-flex items-center gap-1 text-xs font-medium', colorClass, className)}
    >
      <Clock className="h-3 w-3" aria-hidden="true" />
      Reservado por {formatted}
    </span>
  );
}
