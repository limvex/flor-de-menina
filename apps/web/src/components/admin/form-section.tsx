import { Separator } from '@/components/ui/separator';

interface FormSectionProps {
  title: string;
  /** Subtítulo explicativo exibido abaixo do título, antes dos campos. */
  description?: string;
  children: React.ReactNode;
}

/**
 * Agrupa campos de formulário em um card com título e separador.
 * Use para dividir formulários longos em seções temáticas (ex: "Dados gerais", "SEO").
 *
 * @example
 * <FormSection title="Dados gerais" description="Informações principais do produto.">
 *   <Input name="name" />
 *   <Textarea name="description" />
 * </FormSection>
 */
export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <div className="rounded-xl border border-flor-100 bg-white p-6">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-flor-800">{title}</h3>
        {description && <p className="mt-0.5 text-sm text-flor-500">{description}</p>}
      </div>
      <Separator className="mb-6 bg-flor-100" />
      {children}
    </div>
  );
}
