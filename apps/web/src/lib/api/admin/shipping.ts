import type {
  ShippingSettingsResponse,
  UpdateStoreSettingsInput,
  UpdateRegionRuleInput,
  MelhorEnvioConnectionStatus,
  BrazilRegion,
  QuoteShippingResponse,
} from '@flor/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

async function adminFetch<T>(path: string, token: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Cookie: `access_token=${token}`,
      ...options?.headers,
    },
    credentials: 'include',
    cache: 'no-store',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((err as { message?: string }).message ?? res.statusText);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function fetchShippingSettings(token: string): Promise<ShippingSettingsResponse> {
  return adminFetch<ShippingSettingsResponse>('/admin/shipping/settings', token);
}

export async function updateShippingSettings(
  token: string,
  data: UpdateStoreSettingsInput,
): Promise<ShippingSettingsResponse> {
  return adminFetch<ShippingSettingsResponse>('/admin/shipping/settings', token, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function updateRegionRule(
  token: string,
  region: BrazilRegion,
  data: UpdateRegionRuleInput,
): Promise<ShippingSettingsResponse> {
  return adminFetch<ShippingSettingsResponse>(`/admin/shipping/regions/${region}`, token, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function getMeAuthUrl(token: string): Promise<{ url: string }> {
  return adminFetch<{ url: string }>('/admin/shipping/me/auth-url', token);
}

export async function getMeStatus(token: string): Promise<MelhorEnvioConnectionStatus> {
  return adminFetch<MelhorEnvioConnectionStatus>('/admin/shipping/me/status', token);
}

export async function disconnectMe(token: string): Promise<void> {
  return adminFetch<void>('/admin/shipping/me/disconnect', token, { method: 'POST' });
}

export async function testShippingQuote(
  token: string,
  destinationZipCode: string,
): Promise<QuoteShippingResponse> {
  return adminFetch<QuoteShippingResponse>('/admin/shipping/test-quote', token, {
    method: 'POST',
    body: JSON.stringify({ destinationZipCode }),
  });
}
