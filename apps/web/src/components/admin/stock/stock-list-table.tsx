'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronRight, Package, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StockBadge } from './stock-badge';
import { MovementModal } from './movement-modal';
import { CounterSaleModal } from './counter-sale-modal';
import type { ProductWithStockSummary, VariantStockSummary } from '@flor/types';

interface StockListTableProps {
  data: ProductWithStockSummary[];
  onRefresh: () => void;
}

type VariantWithProduct = VariantStockSummary & { productName: string };

export function StockListTable({ data, onRefresh }: StockListTableProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [movementVariant, setMovementVariant] = useState<VariantWithProduct | null>(null);
  const [counterVariant, setCounterVariant] = useState<VariantWithProduct | null>(null);

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-flor-100 py-16 text-center text-flor-400 text-sm">
        Nenhum produto encontrado.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-flor-100 overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-flor-50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-flor-700 w-8"></th>
              <th className="text-left px-4 py-3 font-medium text-flor-700">Produto</th>
              <th className="text-left px-4 py-3 font-medium text-flor-700">Categoria</th>
              <th className="text-right px-4 py-3 font-medium text-flor-700">Estoque total</th>
              <th className="text-left px-4 py-3 font-medium text-flor-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((product) => {
              const isExpanded = expanded.has(product.id);
              return (
                <React.Fragment key={product.id}>
                  {/* Linha do produto */}
                  <tr
                    className="border-t border-flor-100 hover:bg-flor-50/40 cursor-pointer"
                    onClick={() => toggle(product.id)}
                  >
                    <td className="px-4 py-3 text-flor-400">
                      {isExpanded ? (
                        <ChevronDown className="size-4" />
                      ) : (
                        <ChevronRight className="size-4" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.thumbUrl ? (
                          <img
                            src={product.thumbUrl}
                            alt={product.name}
                            className="size-9 rounded object-cover shrink-0"
                          />
                        ) : (
                          <div className="size-9 rounded bg-flor-100 flex items-center justify-center shrink-0">
                            <Package className="size-4 text-flor-300" />
                          </div>
                        )}
                        <span className="font-medium text-flor-800">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-flor-500">{product.categoryName}</td>
                    <td className="px-4 py-3 text-right font-semibold text-flor-800">
                      {product.totalStock}
                    </td>
                    <td className="px-4 py-3">
                      <StockBadge stock={product.totalStock} />
                    </td>
                  </tr>

                  {/* Linhas das variantes */}
                  {isExpanded &&
                    product.variants.map((variant) => (
                      <tr
                        key={variant.id}
                        className={`border-t border-flor-50 ${
                          variant.stock <= 0
                            ? 'bg-red-50/60'
                            : variant.stock < 5
                              ? 'bg-yellow-50/60'
                              : 'bg-white'
                        }`}
                      >
                        <td />
                        <td className="px-4 py-2.5 pl-14">
                          <span className="text-flor-600 font-mono text-xs bg-flor-50 px-1.5 py-0.5 rounded">
                            {variant.sku}
                          </span>
                          <span className="ml-2 text-flor-700">
                            {[variant.size, variant.color].filter(Boolean).join(' / ') || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-flor-400 text-xs">&nbsp;</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-flor-800">
                          {variant.stock}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <StockBadge stock={variant.stock} />
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs px-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMovementVariant({ ...variant, productName: product.name });
                              }}
                            >
                              Movimentar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs px-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCounterVariant({ ...variant, productName: product.name });
                              }}
                            >
                              Venda balcão
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs px-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/admin/estoque/${variant.id}`);
                              }}
                            >
                              <Eye className="size-3 mr-1" />
                              Histórico
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {movementVariant && (
        <MovementModal
          open
          onOpenChange={(v) => !v && setMovementVariant(null)}
          variant={movementVariant}
          onSuccess={() => {
            setMovementVariant(null);
            onRefresh();
          }}
        />
      )}

      {counterVariant && (
        <CounterSaleModal
          open
          onOpenChange={(v) => !v && setCounterVariant(null)}
          variant={counterVariant}
          onSuccess={() => {
            setCounterVariant(null);
            onRefresh();
          }}
        />
      )}
    </>
  );
}
