'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

const TEMPLATES = [
  { key: 'email-verification', label: 'Verificação de e-mail' },
  { key: 'password-reset', label: 'Redefinição de senha' },
  { key: 'order-created', label: 'Pedido criado' },
  { key: 'payment-approved', label: 'Pagamento aprovado' },
  { key: 'payment-rejected', label: 'Pagamento rejeitado' },
  { key: 'order-shipped', label: 'Pedido enviado' },
  { key: 'order-delivered', label: 'Entregue' },
  { key: 'review-invitation', label: 'Convite para avaliar' },
];

async function fetchPreview(template: string): Promise<{ html: string; subject: string }> {
  const res = await fetch(`${API}/admin/emails/preview/${template}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Erro ao buscar preview');
  return res.json();
}

export default function EmailPreviewPage() {
  const [selected, setSelected] = useState(TEMPLATES[0].key);
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');

  const { data, isLoading } = useQuery({
    queryKey: ['email-preview', selected],
    queryFn: () => fetchPreview(selected),
  });

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Sidebar */}
      <aside className="w-56 border-r bg-white flex-shrink-0 overflow-y-auto">
        <div className="p-4 border-b">
          <h2 className="text-sm font-semibold text-flor-800">Templates</h2>
        </div>
        <nav className="p-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.key}
              onClick={() => setSelected(t.key)}
              className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                selected === t.key
                  ? 'bg-flor-100 text-flor-900 font-medium'
                  : 'text-flor-600 hover:bg-flor-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Preview area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="border-b bg-white px-4 py-2 flex items-center gap-3">
          <div className="flex-1">
            {data && (
              <span className="text-xs text-flor-500">
                <span className="font-medium text-flor-700">Assunto:</span> {data.subject}
              </span>
            )}
          </div>
          <div className="flex gap-1 bg-flor-50 rounded p-1">
            <Button
              size="sm"
              variant={viewport === 'desktop' ? 'default' : 'ghost'}
              className="h-7 text-xs"
              onClick={() => setViewport('desktop')}
            >
              Desktop
            </Button>
            <Button
              size="sm"
              variant={viewport === 'mobile' ? 'default' : 'ghost'}
              className="h-7 text-xs"
              onClick={() => setViewport('mobile')}
            >
              Mobile
            </Button>
          </div>
        </div>

        {/* iframe */}
        <div className="flex-1 overflow-auto bg-neutral-100 flex items-start justify-center p-6">
          {isLoading && <div className="text-flor-400 text-sm mt-8">Carregando preview...</div>}
          {data && (
            <div
              style={{
                width: viewport === 'mobile' ? '375px' : '100%',
                maxWidth: viewport === 'desktop' ? '700px' : undefined,
                transition: 'width 0.2s ease',
              }}
            >
              <iframe
                srcDoc={data.html}
                title="Email preview"
                style={{
                  width: '100%',
                  height: '80vh',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  backgroundColor: '#fff',
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
