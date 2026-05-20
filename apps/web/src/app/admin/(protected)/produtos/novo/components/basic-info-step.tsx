'use client';

import { Control, Controller, FieldErrors, UseFormRegister } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { type Category } from '@/lib/api/categories';
import { type NewProductFormData } from './new-product-schema';

interface BasicInfoStepProps {
  register: UseFormRegister<NewProductFormData>;
  control: Control<NewProductFormData>;
  errors: FieldErrors<NewProductFormData>;
  categories: Category[];
}

export function BasicInfoStep({ register, control, errors, categories }: BasicInfoStepProps) {
  return (
    <section className="space-y-4 rounded-lg border border-bege-200 bg-white p-5 sm:p-6">
      <h2 className="font-serif text-lg text-flor-800">Informações básicas</h2>

      <div>
        <Label htmlFor="name">Nome do produto *</Label>
        <Input
          id="name"
          {...register('name')}
          className="mt-1.5"
          placeholder="Ex: Vestido midi floral"
          autoComplete="off"
        />
        {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          {...register('description')}
          className="mt-1.5 min-h-[140px]"
          placeholder="Conte sobre o tecido, o caimento, ocasiões de uso… (opcional)"
        />
      </div>

      <div>
        <Label>Categoria *</Label>
        <Controller
          name="categoryId"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Escolha uma categoria">
                  {field.value
                    ? (categories.find((c) => c.id === field.value)?.name ?? undefined)
                    : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.categoryId && (
          <p className="text-xs text-destructive mt-1">{errors.categoryId.message}</p>
        )}
      </div>
    </section>
  );
}
