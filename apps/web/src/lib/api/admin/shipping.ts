import type {
  ShippingSettingsResponse,
  UpdateStoreSettingsInput,
  UpdateRegionRuleInput,
  MelhorEnvioConnectionStatus,
  BrazilRegion,
  QuoteShippingResponse,
} from '@flor/types';

import { ApiError, messageForHttpStatus, readErrorFromResponse } from '@/lib/errors';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

async function adminFetch<T>(path: string, token: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Cookie: `access_token=${token}`,
        ...options?.headers,
      },
      credentials: 'include',
      cache: 'no-store',
    });
  } catch (cause) {
    if (cause instanceof TypeError) {
      throw new ApiError(messageForHttpStatus(0), 0, { cause });
    }
    throw cause;
  }

  if (!res.ok) {
    await readErrorFromResponse(res);
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
