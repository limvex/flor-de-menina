'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi, type ListProductsParams } from '@/lib/api/products';

export const PRODUCTS_KEY = 'products';

export function useProducts(params: ListProductsParams = {}) {
  return useQuery({
    queryKey: [PRODUCTS_KEY, 'list', params],
    queryFn: () => productsApi.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useProductStats() {
  return useQuery({
    queryKey: [PRODUCTS_KEY, 'stats'],
    queryFn: () => productsApi.stats(),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: [PRODUCTS_KEY, id],
    queryFn: () => productsApi.getById(id),
    enabled: !!id,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { categoriesApi } = await import('@/lib/api/categories');
      return categoriesApi.listAdmin();
    },
    staleTime: 5 * 60_000,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] });
    },
  });
}

export function useUpdateProduct(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof productsApi.update>[1]) => productsApi.update(id, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: productsApi.delete,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] });
    },
  });
}

export function useRestoreProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: productsApi.restore,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] });
    },
  });
}

export function useUpsertVariants(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (variants: Parameters<typeof productsApi.upsertVariants>[1]) =>
      productsApi.upsertVariants(productId, variants),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [PRODUCTS_KEY, productId] });
    },
  });
}

export function useBulkSetActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, active }: { ids: string[]; active: boolean }) =>
      productsApi.bulkSetActive(ids, active),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] });
    },
  });
}
