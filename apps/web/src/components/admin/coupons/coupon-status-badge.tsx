import { Badge } from '@/components/ui/badge';

interface Props {
  status: string;
}

const STATUS_MAP: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  active: { label: 'Ativo', variant: 'default' },
  expired: { label: 'Expirado', variant: 'secondary' },
  exhausted: { label: 'Esgotado', variant: 'destructive' },
  inactive: { label: 'Inativo', variant: 'outline' },
  scheduled: { label: 'Agendado', variant: 'secondary' },
};

export function CouponStatusBadge({ status }: Props) {
  const { label, variant } = STATUS_MAP[status] ?? { label: status, variant: 'outline' };
  return <Badge variant={variant}>{label}</Badge>;
}
