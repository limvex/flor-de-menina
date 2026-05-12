'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { adminReviewsApi, type AdminReviewListItem } from '@/lib/api/admin-reviews';

export function AdminReviewsClient() {
  const qc = useQueryClient();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [active, setActive] = useState<AdminReviewListItem | null>(null);
  const [reason, setReason] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-reviews', 'PENDING'],
    queryFn: () => adminReviewsApi.list({ status: 'PENDING', page: 1, pageSize: 50 }),
  });

  const moderate = useMutation({
    mutationFn: ({
      id,
      status,
      rejectionReason,
    }: {
      id: string;
      status: 'APPROVED' | 'REJECTED';
      rejectionReason?: string;
    }) => adminReviewsApi.moderate(id, { status, rejectionReason }),
    onSuccess: () => {
      toast.success('Review atualizada');
      void qc.invalidateQueries({ queryKey: ['admin-reviews'] });
      void qc.invalidateQueries({ queryKey: ['admin-dashboard'] });
      setRejectOpen(false);
      setActive(null);
      setReason('');
    },
    onError: () => {
      toast.error('Não foi possível salvar');
    },
  });

  const openReject = (item: AdminReviewListItem) => {
    setActive(item);
    setReason('');
    setRejectOpen(true);
  };

  const confirmReject = () => {
    if (!active) return;
    if (!reason.trim()) {
      toast.error('Informe o motivo da rejeição');
      return;
    }
    moderate.mutate({ id: active.id, status: 'REJECTED', rejectionReason: reason.trim() });
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-flor-100 py-12 text-center text-sm text-flor-400">
        Carregando reviews…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        Não foi possível carregar as avaliações.
      </div>
    );
  }

  if (!data?.items.length) {
    return (
      <p className="text-sm text-muted-foreground rounded-xl border border-flor-100 bg-white px-4 py-8 text-center">
        Nenhuma avaliação pendente.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {data.items.map((r) => (
          <article
            key={r.id}
            className="rounded-xl border border-flor-100 bg-white p-4 shadow-sm space-y-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium text-flor-900">{r.product.name}</p>
                <p className="text-xs text-muted-foreground">
                  {r.user.name} · {r.user.email} · {new Date(r.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="flex items-center gap-1 text-amber-800 font-medium text-sm">
                {'★'.repeat(r.rating)}
                <span className="text-muted-foreground text-xs ml-1">({r.rating}/5)</span>
              </div>
            </div>
            {r.title && <p className="text-sm font-medium text-flor-800">{r.title}</p>}
            <p className="text-sm text-flor-700 whitespace-pre-wrap">{r.comment}</p>
            {r.photos.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {r.photos.map((url) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-flor-700 underline"
                  >
                    Ver foto
                  </a>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                size="sm"
                onClick={() => moderate.mutate({ id: r.id, status: 'APPROVED' })}
                disabled={moderate.isPending}
              >
                Aprovar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openReject(r)}
                disabled={moderate.isPending}
              >
                Rejeitar
              </Button>
            </div>
          </article>
        ))}
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Motivo da rejeição</DialogTitle>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explique o motivo para a cliente…"
            rows={4}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRejectOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={confirmReject} disabled={moderate.isPending}>
              Confirmar rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
