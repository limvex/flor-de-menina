'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { type ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Power, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { CategoryAdminDto } from '@flor/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/admin/data-table';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  deleteCategoryAction,
  toggleActiveCategoryAction,
} from '@/app/admin/(protected)/categorias/actions';

interface Props {
  data: CategoryAdminDto[];
}

export function CategoryListTable({ data }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [deleteTarget, setDeleteTarget] = useState<CategoryAdminDto | null>(null);

  const filtered = data.filter((c) => {
    const matchesSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === 'all' ||
      (filter === 'active' && c.isActive) ||
      (filter === 'inactive' && !c.isActive);
    return matchesSearch && matchesFilter;
  });

  function handleToggle(cat: CategoryAdminDto) {
    startTransition(async () => {
      const result = await toggleActiveCategoryAction(cat.id);
      if (!result.ok) {
        toast.error(result.error ?? 'Erro ao alterar status');
        return;
      }
      toast.success(cat.isActive ? 'Categoria desativada' : 'Categoria ativada');
      router.refresh();
    });
  }

  function handleDelete(cat: CategoryAdminDto) {
    startTransition(async () => {
      const result = await deleteCategoryAction(cat.id);
      if (!result.ok) {
        toast.error(result.error ?? 'Erro ao remover categoria');
        return;
      }
      toast.success('Categoria removida');
      router.refresh();
    });
  }

  const columns: ColumnDef<CategoryAdminDto>[] = [
    {
      accessorKey: 'name',
      header: 'Nome',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-flor-800">{row.original.name}</p>
          <p className="text-xs text-flor-400">{row.original.slug}</p>
        </div>
      ),
    },
    {
      accessorKey: 'parent',
      header: 'Categoria pai',
      cell: ({ row }) => (
        <span className="text-sm text-flor-600">{row.original.parent?.name ?? '—'}</span>
      ),
    },
    {
      id: 'counts',
      header: 'Subcats / Produtos',
      cell: ({ row }) => (
        <span className="text-sm text-flor-500">
          {row.original._count.children} / {row.original._count.products}
        </span>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            row.original.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-flor-100 text-flor-500'
          }`}
        >
          {row.original.isActive ? 'Ativa' : 'Inativa'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const cat = row.original;
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="size-4" />
                    <span className="sr-only">Ações</span>
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                <DropdownMenuItem render={<Link href={`/admin/categorias/${cat.id}`} />}>
                  <Pencil className="size-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleToggle(cat)}>
                  <Power className="size-4" />
                  {cat.isActive ? 'Desativar' : 'Ativar'}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDeleteTarget(cat)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="size-4" />
                  Remover
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Buscar por nome ou slug..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <div className="flex gap-2">
          {(['all', 'active', 'inactive'] as const).map((f) => (
            <Button
              key={f}
              type="button"
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'Todos' : f === 'active' ? 'Ativas' : 'Inativas'}
            </Button>
          ))}
        </div>
      </div>

      <DataTable columns={columns} data={filtered} emptyMessage="Nenhuma categoria encontrada." />

      <ConfirmDialog
        open={deleteTarget != null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Remover "${deleteTarget?.name}"?`}
        description="Esta ação não pode ser desfeita. A categoria só pode ser removida se não tiver subcategorias ou produtos associados."
        confirmLabel="Remover"
        variant="destructive"
        onConfirm={() => {
          if (deleteTarget) handleDelete(deleteTarget);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
