import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  /** Ícone lucide exibido acima do título. */
  icon?: LucideIcon;
  title: string;
  description?: string;
  /** Slot para um botão ou link de ação (ex: "Criar produto"). */
  action?: React.ReactNode;
}

/**
 * Estado vazio padrão para listas, tabelas e páginas sem conteúdo.
 * Use também para placeholders de páginas em construção.
 *
 * @example
 * <EmptyState
 *   icon={Package}
 *   title="Nenhum produto encontrado"
 *   description="Crie o primeiro produto para começar."
 *   action={<Button onClick={onCreate}>Criar produto</Button>}
 * />
 */
export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="mb-4 rounded-full bg-flor-100 p-4">
          <Icon className="h-8 w-8 text-flor-400" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-base font-semibold text-flor-800">{title}</h3>
      {description && <p className="mt-1 text-sm text-flor-500 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
