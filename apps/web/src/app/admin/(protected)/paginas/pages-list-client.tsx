'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import { ExternalLink, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { InstitutionalPageAdmin } from '@flor/types';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { DataTable } from '@/components/admin/data-table';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { deleteAdminPage, fetchAdminPages, toggleAdminPageActive } from '@/lib/admin/pages-api';

interface Props {
  initialPages: InstitutionalPageAdmin[];
}

export function PagesListClient({ initialPages }: Props) {
  const router = useRouter();
  const [pages, setPages] = useState(initialPages);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<InstitutionalPageAdmin | null>(null);

  const filteredPages = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pages;
    return pages.filter((p) => p.title.toLowerCase().includes(q));
  }, [pages, search]);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminPages(null, { sort: 'sortOrder:asc' });
      setPages(data);
    } catch {
      toast.error('Erro ao carregar páginas');
    } finally {
      setLoading(false);
    }
  }, []);

  async function handleToggleActive(row: InstitutionalPageAdmin) {
    try {
      const updated = await toggleAdminPageActive(row.id);
      setPages((prev) => prev.map((p) => (p.id === row.id ? updated : p)));
      toast.success(updated.isActive ? 'Página ativada' : 'Página desativada');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao alternar status');
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteAdminPage(deleteTarget.id);
      toast.success('Página excluída');
      setDeleteTarget(null);
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao excluir');
    }
  }

  const columns: ColumnDef<InstitutionalPageAdmin>[] = [
    {
      accessorKey: 'title',
      header: 'Título',
      cell: ({ row }) => <span className="font-medium text-flor-900">{row.original.title}</span>,
    },
    {
      accessorKey: 'slug',
      header: 'URL',
      cell: ({ row }) => (
        <code className="text-xs text-flor-600 bg-flor-50 px-1.5 py-0.5 rounded">
          /p/{row.original.slug}
        </code>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={row.original.isActive}
            onCheckedChange={() => void handleToggleActive(row.original)}
            aria-label={row.original.isActive ? 'Desativar página' : 'Ativar página'}
          />
          <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
            {row.original.isActive ? 'Ativa' : 'Inativa'}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: 'updatedAt',
      header: 'Última edição',
      cell: ({ row }) => (
        <span className="text-flor-600 text-xs whitespace-nowrap">
          {new Date(row.original.updatedAt).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md text-flor-500 hover:bg-flor-100 hover:text-flor-800 transition-colors">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Ações</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`/admin/paginas/${row.original.id}`)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                window.open(`/p/${row.original.slug}`, '_blank', 'noopener,noreferrer')
              }
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Visualizar
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(row.original)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Buscar por título..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm"
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredPages}
        isLoading={loading}
        emptyMessage="Nenhuma página encontrada."
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Excluir página"
        description={
          deleteTarget
            ? `Remover permanentemente "${deleteTarget.title}"? Links para /p/${deleteTarget.slug} passarão a retornar 404.`
            : ''
        }
        confirmLabel="Excluir"
        variant="destructive"
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
