'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ApiError } from '@/lib/errors';
import { getTransitionLabel } from '@/lib/orders/status-labels';
import { fetchAdminOrderValidTransitions, patchAdminOrderStatus } from '@/lib/api/admin-orders';
import { cn } from '@/lib/utils';

const selectTriggerClass =
  'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

export function OrderStatusUpdater({
  accessToken,
  orderId,
  orderStatus,
}: {
  accessToken: string;
  orderId: string;
  orderStatus: string;
}) {
  const queryClient = useQueryClient();
  const [nextStatus, setNextStatus] = useState('');
  const [trackingCode, setTrackingCode] = useState('');
  const [notify, setNotify] = useState(true);
  const [notes, setNotes] = useState('');

  const { data: transitions, isLoading: loadingT } = useQuery({
    queryKey: ['admin-order-transitions', orderId, orderStatus],
    queryFn: () => fetchAdminOrderValidTransitions(accessToken, orderId),
    enabled: Boolean(orderId) && Boolean(accessToken),
  });

  const validNext = transitions?.validNext ?? [];

  const mutation = useMutation({
    mutationFn: () => {
      if (!nextStatus) throw new Error('Selecione um status');
      return patchAdminOrderStatus(accessToken, orderId, {
        status: nextStatus,
        trackingCode: nextStatus === 'SHIPPED' ? trackingCode.trim() : undefined,
        notifyCustomer: notify,
        notes: notes.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success('Status atualizado!');
      void queryClient.invalidateQueries({ queryKey: ['admin-order', orderId] });
      void queryClient.invalidateQueries({ queryKey: ['admin-order-transitions', orderId] });
      void queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      setNextStatus('');
      setTrackingCode('');
      setNotes('');
    },
    onError: (err: unknown) => {
      const msg = ApiError.isApiError(err)
        ? err.message
        : err instanceof Error
          ? err.message
          : 'Erro ao atualizar status';
      toast.error(msg);
    },
  });

  const trackingOk = nextStatus !== 'SHIPPED' || trackingCode.trim().length > 0;

  const canSubmit = useMemo(() => {
    return Boolean(nextStatus) && trackingOk && !mutation.isPending;
  }, [nextStatus, trackingOk, mutation.isPending]);

  if (loadingT) {
    return (
      <div className="rounded-xl border border-flor-100 bg-white p-4 text-sm text-muted-foreground">
        Carregando ações…
      </div>
    );
  }

  if (!validNext.length) {
    return (
      <div className="rounded-xl border border-flor-100 bg-white p-4 text-sm text-muted-foreground">
        Nenhuma transição disponível para este pedido.
      </div>
    );
  }

  return (
    <section
      data-testid="order-status-form"
      className="rounded-xl border border-flor-100 bg-white p-4 shadow-sm space-y-4"
    >
      <div>
        <h2 className="font-medium text-flor-900">Atualizar status</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Somente transições permitidas para o estado atual aparecem abaixo.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="next-status">Novo status</Label>
        <select
          id="next-status"
          data-testid="order-status-select"
          className={cn(selectTriggerClass)}
          value={nextStatus}
          onChange={(e) => setNextStatus(e.target.value)}
        >
          <option value="">Selecione…</option>
          {validNext.map((s) => (
            <option key={s} value={s}>
              {getTransitionLabel(s)}
            </option>
          ))}
        </select>
      </div>

      {nextStatus === 'SHIPPED' && (
        <div className="space-y-2">
          <Label htmlFor="tracking">Código de rastreio *</Label>
          <Input
            id="tracking"
            data-testid="order-tracking-input"
            value={trackingCode}
            onChange={(e) => setTrackingCode(e.target.value)}
            placeholder="Cole o código dos Correios ou transportadora"
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground">
            Obrigatório para marcar como enviado. Rastreio é manual (sem etiqueta automática).
          </p>
        </div>
      )}

      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <Checkbox
          data-testid="notify-customer"
          checked={notify}
          onCheckedChange={(v) => setNotify(v === true)}
        />
        <span>Notificar cliente por e-mail</span>
      </label>

      <div className="space-y-2">
        <Label htmlFor="notes">Observações (opcional)</Label>
        <Textarea
          id="notes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ex.: enviado via Sedex"
        />
      </div>

      <Button
        type="button"
        data-testid="order-status-submit"
        className="w-full sm:w-auto"
        disabled={!canSubmit}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending ? 'Atualizando…' : 'Atualizar status'}
      </Button>
    </section>
  );
}
