'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Copy, MoreHorizontal, Pencil, Trash2, Eye, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CouponStatusBadge } from '@/components/admin/coupons/coupon-status-badge';
import { CouponTypeBadge } from '@/components/admin/coupons/coupon-type-badge';
import { formatPrice } from '@/lib/format';
import { fetchCoupons, deleteCoupon } from '@/lib/admin/coupons-api';
import type { CouponListResponse, CouponWithStatus } from '@/lib/admin/coupons-api';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Ativos' },
  { value: 'expired', label: 'Expirados' },
  { value: 'exhausted', label: 'Esgotados' },
  { value: 'inactive', label: 'Inativos' },
];

interface Props {
  initialData: CouponListResponse;
  initialFilters: { status: string; search: string };
}

function formatCouponValue(coupon: CouponWithStatus): string {
  if (coupon.type === 'FREE_SHIPPING') return 'Frete grátis';
  if (coupon.type === 'PERCENTAGE') return `${coupon.value}%`;
  return formatPrice(coupon.value);
}

function formatValidity(from: string, until: string): string {
  const f = new Date(from);
  const u = new Date(until);
  return `${f.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} até ${u.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}`;
}

export function CouponListClient({ initialData, initialFilters }: Props) {
  const router = useRouter();
  const [data, setData] = useState<CouponListResponse>(initialData);
  const [status, setStatus] = useState(initialFilters.status);
  const [search, setSearch] = useState(initialFilters.search);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(
    async (newStatus?: string, newSearch?: string) => {
      setLoading(true);
      try {
        const params: Record<string, string> = {};
        const s = newStatus ?? status;
        const q = newSearch ?? search;
        if (s !== 'all') params['status'] = s;
        if (q) params['search'] = q;
        const result = await fetchCoupons(null, params);
        setData(result);
      } finally {
        setLoading(false);
      }
    },
    [status, search],
  );

  function handleStatusChange(s: string) {
    setStatus(s);
    void reload(s, search);
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setSearch(q);
    void reload(status, q);
  }

  async function handleDelete(coupon: CouponWithStatus) {
    if (!confirm(`Excluir/desativar cupom "${coupon.code}"?`)) return;
    try {
      await deleteCoupon(coupon.id);
      toast.success('Cupom removido');
      void reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao excluir');
    }
  }

  function handleCopyCode(code: string) {
    void navigator.clipboard.writeText(code);
    toast.success(`Código "${code}" copiado`);
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="flex gap-1 rounded-lg border border-stone-200 bg-white p-1">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleStatusChange(opt.value)}
              className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                status === opt.value
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <Input
          placeholder="Buscar por código..."
          value={search}
          onChange={handleSearchChange}
          className="w-64 font-mono"
        />
      </div>

      {/* Tabela */}
      <div className="rounded-lg border border-stone-200 bg-white overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-stone-400">Carregando...</div>
        ) : data.data.length === 0 ? (
          <div className="py-16 text-center text-sm text-stone-400">Nenhum cupom encontrado</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-stone-100 bg-stone-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-stone-600">Código</th>
                <th className="px-4 py-3 text-left font-medium text-stone-600">Tipo</th>
                <th className="px-4 py-3 text-left font-medium text-stone-600">Valor</th>
                <th className="px-4 py-3 text-left font-medium text-stone-600">Validade</th>
                <th className="px-4 py-3 text-left font-medium text-stone-600">Usos</th>
                <th className="px-4 py-3 text-left font-medium text-stone-600">Receita</th>
                <th className="px-4 py-3 text-left font-medium text-stone-600">Status</th>
                <th className="px-2 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {data.data.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-stone-900">{coupon.code}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(coupon.code)}
                        className="text-stone-400 hover:text-stone-600 transition-colors"
                        aria-label="Copiar código"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {coupon.description && (
                      <p className="text-xs text-stone-400 mt-0.5 truncate max-w-[200px]">
                        {coupon.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <CouponTypeBadge type={coupon.type} value={coupon.value} />
                  </td>
                  <td className="px-4 py-3 font-medium text-stone-800">
                    {formatCouponValue(coupon)}
                  </td>
                  <td className="px-4 py-3 text-stone-500 text-xs">
                    {formatValidity(coupon.validFrom, coupon.validUntil)}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {coupon.totalUses}
                    {coupon.maxTotalUses ? ` / ${coupon.maxTotalUses}` : ' / ∞'}
                  </td>
                  <td className="px-4 py-3 text-stone-600">{formatPrice(coupon.totalRevenue)}</td>
                  <td className="px-4 py-3">
                    <CouponStatusBadge status={coupon.status} />
                  </td>
                  <td className="px-2 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md text-stone-500 hover:bg-stone-100 hover:text-stone-700 transition-colors">
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/admin/cupons/${coupon.id}`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push(`/admin/cupons/${coupon.id}/editar`)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push(`/admin/cupons/novo?duplicate=${coupon.id}`)}
                        >
                          <Layers className="mr-2 h-4 w-4" />
                          Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => void handleDelete(coupon)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {data.pages > 1 && (
        <div className="flex items-center justify-between text-sm text-stone-500">
          <span>{data.total} cupons no total</span>
          <span>
            Página {data.page} de {data.pages}
          </span>
        </div>
      )}
    </div>
  );
}
