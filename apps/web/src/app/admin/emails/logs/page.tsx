'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

interface EmailLog {
  id: string;
  event: string;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'RETRYING';
  resendId?: string;
  idempotencyKey: string;
  payload: unknown;
  errorMessage?: string;
  attemptCount: number;
  userId?: string;
  orderId?: string;
  createdAt: string;
  sentAt?: string;
}

const statusColors: Record<string, string> = {
  SENT: 'bg-green-100 text-green-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  RETRYING: 'bg-blue-100 text-blue-800',
  FAILED: 'bg-red-100 text-red-800',
};

const eventLabels: Record<string, string> = {
  EMAIL_VERIFICATION: 'Verificação',
  PASSWORD_RESET: 'Reset senha',
  ORDER_CREATED: 'Pedido criado',
  PAYMENT_APPROVED: 'Pagamento aprovado',
  PAYMENT_REJECTED: 'Pagamento rejeitado',
  ORDER_SHIPPED: 'Enviado',
  ORDER_DELIVERED: 'Entregue',
  REVIEW_INVITATION: 'Avaliação',
};

async function fetchLogs(params: URLSearchParams) {
  const res = await fetch(`${API}/admin/emails/logs?${params}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Erro ao buscar logs');
  return res.json();
}

async function resendEmail(id: string) {
  const res = await fetch(`${API}/admin/emails/logs/${id}/resend`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Erro ao reenviar email');
  return res.json();
}

export default function EmailLogsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [event, setEvent] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);

  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (event) params.set('event', event);
  if (status) params.set('status', status);
  if (search) params.set('search', search);

  const { data, isLoading } = useQuery({
    queryKey: ['email-logs', page, event, status, search],
    queryFn: () => fetchLogs(params),
  });

  const resendMutation = useMutation({
    mutationFn: resendEmail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-logs'] });
      setSelectedLog(null);
    },
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-flor-900">Logs de e-mail</h1>
        <p className="text-sm text-flor-500 mt-1">Histórico de envios transacionais</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-4">
        <Input
          placeholder="Buscar por e-mail..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-64"
        />
        <Select
          value={event || 'all'}
          onValueChange={(v: string | null) => {
            setEvent(!v || v === 'all' ? '' : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todos os eventos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os eventos</SelectItem>
            {Object.entries(eventLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={status || 'all'}
          onValueChange={(v: string | null) => {
            setStatus(!v || v === 'all' ? '' : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="SENT">Enviado</SelectItem>
            <SelectItem value="PENDING">Pendente</SelectItem>
            <SelectItem value="RETRYING">Tentando</SelectItem>
            <SelectItem value="FAILED">Falhou</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Evento</TableHead>
              <TableHead>Destinatário</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tentativas</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-flor-400">
                  Carregando...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && data?.items?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-flor-400">
                  Nenhum log encontrado
                </TableCell>
              </TableRow>
            )}
            {data?.items?.map((log: EmailLog) => (
              <TableRow
                key={log.id}
                className="cursor-pointer hover:bg-flor-50"
                onClick={() => setSelectedLog(log)}
              >
                <TableCell className="text-xs text-flor-500 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString('pt-BR')}
                </TableCell>
                <TableCell>
                  <span className="text-xs font-medium text-flor-700">
                    {eventLabels[log.event] ?? log.event}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-flor-700">
                  {log.recipientName && <div className="font-medium">{log.recipientName}</div>}
                  <div className="text-flor-400 text-xs">{log.recipientEmail}</div>
                </TableCell>
                <TableCell>
                  <Badge className={`text-xs ${statusColors[log.status]}`}>{log.status}</Badge>
                </TableCell>
                <TableCell className="text-sm text-flor-500">{log.attemptCount}</TableCell>
                <TableCell>
                  {log.status === 'FAILED' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        resendMutation.mutate(log.id);
                      }}
                      disabled={resendMutation.isPending}
                    >
                      Reenviar
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-flor-400">
            {data.total} registros · Página {page} de {data.totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      {/* Modal de detalhe */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhe do envio</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-flor-400">Evento</span>
                  <div className="font-medium">
                    {eventLabels[selectedLog.event] ?? selectedLog.event}
                  </div>
                </div>
                <div>
                  <span className="text-flor-400">Status</span>
                  <div>
                    <Badge className={`text-xs ${statusColors[selectedLog.status]}`}>
                      {selectedLog.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-flor-400">Destinatário</span>
                  <div className="font-medium">{selectedLog.recipientEmail}</div>
                </div>
                <div>
                  <span className="text-flor-400">Tentativas</span>
                  <div>{selectedLog.attemptCount}</div>
                </div>
                <div>
                  <span className="text-flor-400">Resend ID</span>
                  <div className="font-mono text-xs">{selectedLog.resendId ?? '—'}</div>
                </div>
                <div>
                  <span className="text-flor-400">Enviado em</span>
                  <div>
                    {selectedLog.sentAt
                      ? new Date(selectedLog.sentAt).toLocaleString('pt-BR')
                      : '—'}
                  </div>
                </div>
              </div>
              {selectedLog.errorMessage && (
                <div>
                  <span className="text-flor-400">Erro</span>
                  <div className="mt-1 p-2 bg-red-50 rounded text-red-700 text-xs font-mono whitespace-pre-wrap">
                    {selectedLog.errorMessage}
                  </div>
                </div>
              )}
              <div>
                <span className="text-flor-400">Payload</span>
                <pre className="mt-1 p-2 bg-flor-50 rounded text-xs overflow-auto max-h-48">
                  {JSON.stringify(selectedLog.payload, null, 2)}
                </pre>
              </div>
              {selectedLog.status === 'FAILED' && (
                <Button
                  className="w-full"
                  onClick={() => resendMutation.mutate(selectedLog.id)}
                  disabled={resendMutation.isPending}
                >
                  Reenviar e-mail
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
