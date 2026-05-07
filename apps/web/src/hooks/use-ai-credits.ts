'use client';

import { useQuery } from '@tanstack/react-query';
import { aiApi } from '@/lib/api/ai';

export function useAiCredits() {
  return useQuery({
    queryKey: ['ai', 'credits'],
    queryFn: () => aiApi.getCreditBalance(),
    staleTime: 5 * 60_000,
    retry: false,
  });
}
