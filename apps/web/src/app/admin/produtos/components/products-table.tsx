'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Edit2, MoreHorizontal, Trash2, RotateCcw } from 'lucide-react';
import { type Product } from '@/lib/api/products';
import { DeleteProductDialog } from './delete-product-dialog';
import { useDeleteProduct, useRestoreProduct, useBulkSetActive } from '@/hooks/use-products';
import { formatCurrency } from '@/lib/format';

interface ProductsTableProps {
  products: Product[];
  onBulkAction?: () => void;
}

export function ProductsTable({ products, onBulkAction }: ProductsTableProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [toDelete, setToDelete] = useState<Product | null>(null);

  const deleteProduct = useDeleteProduct();
  const restoreProduct = useRestoreProduct();
  const bulkSetActive = useBulkSetActive();

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === products.length) setSelected(new Set());
    else setSelected(new Set(products.map((p) => p.id)));
  };

  const handleBulk = async (active: boolean) => {
    await bulkSetActive.mutateAsync({ ids: Array.from(selected), active });
    setSelected(new Set());
    onBulkAction?.();
  };

  return (
    <>
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-flor-50 border border-flor-200 rounded-md">
          <span className="text-sm text-flor-700">{selected.size} selecionado(s)</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleBulk(true)}
            disabled={bulkSetActive.isPending}
          >
            Ativar
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleBulk(false)}
            disabled={bulkSetActive.isPending}
          >
            Desativar
          </Button>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={selected.size === products.length && products.length > 0}
                onCheckedChange={toggleAll}
              />
            </TableHead>
            <TableHead className="w-16">Foto</TableHead>
            <TableHead>Produto</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Preço</TableHead>
            <TableHead>Estoque</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id} className="hover:bg-bege-50">
              <TableCell>
                <Checkbox
                  checked={selected.has(product.id)}
                  onCheckedChange={() => toggleSelect(product.id)}
                />
              </TableCell>
              <TableCell>
                {product.images[0] ? (
                  <Image
                    src={product.images[0].thumbUrl ?? product.images[0].url}
                    alt={product.name}
                    width={48}
                    height={48}
                    className="rounded object-cover w-12 h-12"
                  />
                ) : (
                  <div className="w-12 h-12 bg-bege-100 rounded flex items-center justify-center text-flor-300 text-xs">
                    Sem foto
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium text-flor-800">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.slug}</p>
                </div>
              </TableCell>
              <TableCell className="text-sm">{product.category?.name ?? '-'}</TableCell>
              <TableCell className="text-sm">{formatCurrency(product.basePrice)}</TableCell>
              <TableCell className="text-sm">{product.totalStock ?? 0}</TableCell>
              <TableCell>
                <StatusBadge product={product} />
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                    <MoreHorizontal size={16} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => router.push(`/admin/produtos/${product.id}`)}>
                      <Edit2 size={14} className="mr-2" />
                      Editar
                    </DropdownMenuItem>
                    {product.deletedAt ? (
                      <DropdownMenuItem
                        onClick={() => restoreProduct.mutate(product.id)}
                        disabled={restoreProduct.isPending}
                      >
                        <RotateCcw size={14} className="mr-2" />
                        Restaurar
                      </DropdownMenuItem>
                    ) : (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setToDelete(product)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 size={14} className="mr-2" />
                          Desativar
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <DeleteProductDialog
        open={!!toDelete}
        productName={toDelete?.name ?? ''}
        loading={deleteProduct.isPending}
        onConfirm={() => {
          if (toDelete) {
            deleteProduct.mutate(toDelete.id, {
              onSuccess: () => setToDelete(null),
            });
          }
        }}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}

function StatusBadge({ product }: { product: Product }) {
  if (product.deletedAt) {
    return (
      <Badge variant="outline" className="text-red-600 border-red-200">
        Deletado
      </Badge>
    );
  }
  if (!product.isActive) {
    return <Badge variant="secondary">Inativo</Badge>;
  }
  if ((product.totalStock ?? 0) === 0) {
    return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Esgotado</Badge>;
  }
  return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Ativo</Badge>;
}
