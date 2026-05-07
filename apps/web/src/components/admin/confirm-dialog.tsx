'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  /** Texto do botão de confirmação. Padrão: "Confirmar". */
  confirmLabel?: string;
  /**
   * Use `'destructive'` para ações irreversíveis (deletar, remover).
   * O botão de confirmação fica vermelho para reforçar o risco.
   */
  variant?: 'default' | 'destructive';
  onConfirm: () => void;
}

/**
 * Diálogo de confirmação para ações que precisam de validação explícita do usuário.
 * Sempre controlado externamente via `open`/`onOpenChange`.
 *
 * @example
 * <ConfirmDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Excluir produto"
 *   description="Esta ação não pode ser desfeita."
 *   confirmLabel="Excluir"
 *   variant="destructive"
 *   onConfirm={handleDelete}
 * />
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirmar',
  variant = 'default',
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={cn(
              variant === 'destructive' &&
                'bg-destructive text-destructive-foreground hover:bg-destructive/90',
            )}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
