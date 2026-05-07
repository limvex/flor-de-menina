'use client';

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type Row,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from './empty-state';

interface DataTableProps<TData> {
  /** Definição das colunas via @tanstack/react-table `ColumnDef`. */
  columns: ColumnDef<TData>[];
  data: TData[];
  /** Exibe skeleton de carregamento no lugar dos dados. */
  isLoading?: boolean;
  /** Mensagem exibida quando `data` está vazio. */
  emptyMessage?: string;
  /** Ao passar, cada linha fica clicável e chama o callback com o objeto `Row`. */
  onRowClick?: (row: Row<TData>) => void;
}

/**
 * Tabela de dados reutilizável baseada em @tanstack/react-table.
 * Gerencia os estados de carregamento (skeleton), vazio e populado.
 * Sem paginação ou filtros — adicione nas páginas que precisarem.
 *
 * @example
 * const columns: ColumnDef<Produto>[] = [
 *   { accessorKey: 'name', header: 'Nome' },
 *   { accessorKey: 'price', header: 'Preço' },
 * ];
 *
 * <DataTable
 *   columns={columns}
 *   data={produtos}
 *   isLoading={isLoading}
 *   onRowClick={(row) => router.push(`/admin/produtos/${row.original.id}`)}
 * />
 */
export function DataTable<TData>({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'Nenhum item encontrado.',
  onRowClick,
}: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return (
      <div className="rounded-xl border border-flor-100 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-flor-50 hover:bg-flor-50">
              {columns.map((_, i) => (
                <TableHead key={i}>
                  <Skeleton className="h-4 w-24" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map((_, colIndex) => (
                  <TableCell key={colIndex}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-flor-100 bg-white">
        <EmptyState title={emptyMessage} />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-flor-100 overflow-hidden">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="bg-flor-50 hover:bg-flor-50">
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="text-flor-600 font-medium">
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={onRowClick ? 'cursor-pointer hover:bg-flor-50' : undefined}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
