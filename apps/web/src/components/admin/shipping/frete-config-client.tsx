'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { FormSection } from '@/components/admin/form-section';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { ShippingTestModal } from './shipping-test-modal';
import type {
  ShippingSettingsResponse,
  RegionShippingRuleResponse,
  BrazilRegion,
  MelhorEnvioConnectionStatus,
} from '@flor/types';

const REGION_LABELS: Record<BrazilRegion, string> = {
  N: 'Norte (N)',
  NE: 'Nordeste (NE)',
  CO: 'Centro-Oeste (CO)',
  SE: 'Sudeste (SE)',
  S: 'Sul (S)',
};

const ALL_REGIONS: BrazilRegion[] = ['N', 'NE', 'CO', 'SE', 'S'];

interface Props {
  initialSettings: ShippingSettingsResponse;
  meStatus: MelhorEnvioConnectionStatus;
  token: string;
}

export function FreteConfigClient({ initialSettings, meStatus, token }: Props) {
  const [settings, setSettings] = useState(initialSettings.settings);
  const [regionRules, setRegionRules] = useState<RegionShippingRuleResponse[]>(
    initialSettings.regionRules,
  );
  const [meConnected, setMeConnected] = useState(meStatus.connected);
  const [meExpiresAt, setMeExpiresAt] = useState(meStatus.expiresAt);
  const [isPending, startTransition] = useTransition();
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [globalEnabled, setGlobalEnabled] = useState(
    initialSettings.settings.freeShippingGlobalThreshold !== null,
  );
  const [globalThreshold, setGlobalThreshold] = useState(
    initialSettings.settings.freeShippingGlobalThreshold?.toString() ?? '299',
  );

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

  function getRuleForRegion(region: BrazilRegion): RegionShippingRuleResponse | undefined {
    return regionRules.find((r) => r.region === region);
  }

  async function saveSettings(patch: Record<string, unknown>) {
    const res = await fetch(`${apiBase}/admin/shipping/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: `access_token=${token}` },
      credentials: 'include',
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error('Falha ao salvar configurações');
    const data = (await res.json()) as {
      settings: typeof settings;
      regionRules: RegionShippingRuleResponse[];
    };
    setSettings(data.settings);
    setRegionRules(data.regionRules);
  }

  async function saveRegionRule(
    region: BrazilRegion,
    patch: { freeShippingMin?: number | null; isActive?: boolean },
  ) {
    const res = await fetch(`${apiBase}/admin/shipping/regions/${region}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: `access_token=${token}` },
      credentials: 'include',
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error('Falha ao salvar regra regional');
    const data = (await res.json()) as {
      settings: typeof settings;
      regionRules: RegionShippingRuleResponse[];
    };
    setSettings(data.settings);
    setRegionRules(data.regionRules);
  }

  function handleSaveOrigin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const cep = (form.elements.namedItem('originZipCode') as HTMLInputElement).value;
    startTransition(async () => {
      try {
        await saveSettings({ originZipCode: cep.replace(/\D/g, '') });
        toast.success('CEP de origem salvo');
      } catch {
        toast.error('Erro ao salvar CEP de origem');
      }
    });
  }

  function handleSaveProvider(provider: string) {
    startTransition(async () => {
      try {
        await saveSettings({ shippingProvider: provider });
        toast.success('Provedor atualizado');
      } catch {
        toast.error('Erro ao salvar provedor');
      }
    });
  }

  function handleSaveGlobalThreshold(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = globalEnabled ? parseFloat(globalThreshold) : null;
    startTransition(async () => {
      try {
        await saveSettings({ freeShippingGlobalThreshold: value });
        toast.success('Frete grátis global atualizado');
      } catch {
        toast.error('Erro ao salvar frete grátis global');
      }
    });
  }

  async function handleConnectMe() {
    const res = await fetch(`${apiBase}/admin/shipping/me/auth-url`, {
      headers: { Cookie: `access_token=${token}` },
      credentials: 'include',
    });
    const data = (await res.json()) as { url: string };
    window.open(data.url, '_blank');
  }

  async function handleDisconnectMe() {
    try {
      await fetch(`${apiBase}/admin/shipping/me/disconnect`, {
        method: 'POST',
        headers: { Cookie: `access_token=${token}` },
        credentials: 'include',
      });
      setMeConnected(false);
      setMeExpiresAt(undefined);
      toast.success('Melhor Envio desconectado');
    } catch {
      toast.error('Erro ao desconectar Melhor Envio');
    }
  }

  return (
    <div className="space-y-6">
      {/* Seção 1 — Endereço de origem */}
      <FormSection
        title="Endereço de origem"
        description="CEP de onde os pedidos serão enviados (loja física em Maceió-AL)."
      >
        <form onSubmit={handleSaveOrigin} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="originZipCode">CEP de origem</Label>
            <Input
              id="originZipCode"
              name="originZipCode"
              defaultValue={settings.originZipCode}
              placeholder="57000-000"
              maxLength={9}
              className="max-w-[180px]"
              aria-describedby="originZipCode-hint"
            />
            <p id="originZipCode-hint" className="text-xs text-flor-500">
              Somente números ou no formato 00000-000
            </p>
          </div>
          <Button
            type="submit"
            disabled={isPending}
            className="bg-flor-800 hover:bg-flor-700 text-white"
          >
            Salvar
          </Button>
        </form>
      </FormSection>

      {/* Seção 2 — Provedor de cotação */}
      <FormSection
        title="Provedor de cotação"
        description="Selecione como o frete será calculado no checkout."
      >
        <div className="space-y-3">
          {[
            {
              value: 'mock',
              label: 'Mock (desenvolvimento)',
              desc: 'Cotação simulada, sem integração real.',
            },
            {
              value: 'melhor_envio',
              label: 'Melhor Envio (produção)',
              desc: 'Requer conexão ativa com o Melhor Envio.',
              disabled: !meConnected,
            },
          ].map((opt) => (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                settings.shippingProvider === opt.value
                  ? 'border-flor-800 bg-flor-50'
                  : 'border-flor-200 hover:border-flor-400'
              } ${opt.disabled ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <input
                type="radio"
                name="provider"
                value={opt.value}
                checked={settings.shippingProvider === opt.value}
                disabled={opt.disabled}
                onChange={() => {
                  if (!opt.disabled) {
                    setSettings((s) => ({ ...s, shippingProvider: opt.value }));
                    handleSaveProvider(opt.value);
                  }
                }}
                className="mt-0.5"
                aria-label={opt.label}
              />
              <div>
                <p className="text-sm font-medium text-flor-800">{opt.label}</p>
                <p className="text-xs text-flor-500">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </FormSection>

      {/* Seção 3 — Conexão Melhor Envio */}
      <FormSection
        title="Conexão Melhor Envio"
        description="Autorize o acesso para cotações reais."
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                meConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
              }`}
              aria-label={meConnected ? 'Status: conectado' : 'Status: não conectado'}
            >
              {meConnected ? 'Conectado' : 'Não conectado'}
            </span>
            {meConnected && meExpiresAt && (
              <span className="text-xs text-flor-500">
                Token expira em {new Date(meExpiresAt).toLocaleString('pt-BR')}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {!meConnected ? (
              <Button
                type="button"
                onClick={handleConnectMe}
                className="bg-flor-800 hover:bg-flor-700 text-white"
              >
                Conectar Melhor Envio
              </Button>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={() => setTestModalOpen(true)}>
                  Testar cotação
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => setDisconnectDialogOpen(true)}
                >
                  Desconectar
                </Button>
                <ConfirmDialog
                  open={disconnectDialogOpen}
                  onOpenChange={setDisconnectDialogOpen}
                  title="Desconectar Melhor Envio?"
                  description="Os tokens OAuth serão removidos. Você precisará reconectar para retomar cotações reais."
                  confirmLabel="Desconectar"
                  variant="destructive"
                  onConfirm={handleDisconnectMe}
                />
              </>
            )}
          </div>
        </div>
      </FormSection>

      {/* Seção 4 — Frete grátis global */}
      <FormSection
        title="Frete grátis global (fallback)"
        description="Aplicado quando uma região não tem regra específica. Com o interruptor desligado, o site não exibe a barra de progresso nem calcula frete grátis por esse valor (o backend também ignora)."
      >
        <form onSubmit={handleSaveGlobalThreshold} className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch
              id="globalEnabled"
              checked={globalEnabled}
              onCheckedChange={setGlobalEnabled}
              aria-label="Ativar frete grátis global"
            />
            <Label htmlFor="globalEnabled">Ativar frete grátis global</Label>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="globalThreshold">Valor mínimo do pedido (R$)</Label>
            <Input
              id="globalThreshold"
              type="number"
              min="0"
              step="0.01"
              value={globalThreshold}
              onChange={(e) => setGlobalThreshold(e.target.value)}
              placeholder="299,00"
              className="max-w-[180px]"
              aria-describedby="globalThreshold-hint"
            />
            <p id="globalThreshold-hint" className="text-xs text-flor-500">
              Pedidos acima desse valor ganham frete grátis.
            </p>
          </div>
          <Button
            type="submit"
            disabled={isPending}
            className="bg-flor-800 hover:bg-flor-700 text-white"
          >
            Salvar
          </Button>
        </form>
      </FormSection>

      {/* Seção 5 — Frete grátis por região */}
      <FormSection
        title="Frete grátis por região"
        description="Configure regras específicas por região do Brasil."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-flor-100 text-left">
                <th className="pb-2 font-medium text-flor-600">Região</th>
                <th className="pb-2 font-medium text-flor-600">Valor mínimo (R$)</th>
                <th className="pb-2 font-medium text-flor-600">Ativo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-flor-50">
              {ALL_REGIONS.map((region) => {
                const rule = getRuleForRegion(region);
                return (
                  <RegionRuleRow key={region} region={region} rule={rule} onSave={saveRegionRule} />
                );
              })}
            </tbody>
          </table>
        </div>
      </FormSection>

      <ShippingTestModal open={testModalOpen} onOpenChange={setTestModalOpen} token={token} />
    </div>
  );
}

function RegionRuleRow({
  region,
  rule,
  onSave,
}: {
  region: BrazilRegion;
  rule: RegionShippingRuleResponse | undefined;
  onSave: (
    region: BrazilRegion,
    patch: { freeShippingMin?: number | null; isActive?: boolean },
  ) => Promise<void>;
}) {
  const [minValue, setMinValue] = useState(rule?.freeShippingMin?.toString() ?? '');
  const [isActive, setIsActive] = useState(rule?.isActive ?? true);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const parsed = parseFloat(minValue);
      await onSave(region, {
        freeShippingMin: Number.isFinite(parsed) ? parsed : null,
        isActive,
      });
      toast.success(`Regra da região ${region} salva`);
    } catch {
      toast.error(`Erro ao salvar regra da região ${region}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr className="py-3">
      <td className="py-3 pr-4 font-medium text-flor-800">{REGION_LABELS[region]}</td>
      <td className="py-3 pr-4">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={minValue}
          onChange={(e) => setMinValue(e.target.value)}
          placeholder="—"
          className="w-28"
          aria-label={`Valor mínimo para ${REGION_LABELS[region]}`}
        />
      </td>
      <td className="py-3 pr-4">
        <div className="flex items-center gap-2">
          <Switch
            checked={isActive}
            onCheckedChange={setIsActive}
            aria-label={`Ativar regra para ${REGION_LABELS[region]}`}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={save}
            disabled={saving}
            className="ml-2"
          >
            Salvar
          </Button>
        </div>
      </td>
    </tr>
  );
}
