import { api } from './client';
import type { Address, CreateAddressInput, UpdateAddressInput } from '@flor/types';

export async function getAddresses(): Promise<Address[]> {
  return api.get<Address[]>('/addresses');
}

export async function createAddress(data: CreateAddressInput): Promise<Address> {
  return api.post<Address>('/addresses', data);
}

export async function updateAddress(id: string, data: UpdateAddressInput): Promise<Address> {
  return api.patch<Address>(`/addresses/${id}`, data);
}

export async function deleteAddress(id: string): Promise<void> {
  return api.delete(`/addresses/${id}`);
}

export async function setDefaultShipping(id: string): Promise<Address> {
  return api.patch<Address>(`/addresses/${id}/set-default-shipping`);
}

export async function setDefaultBilling(id: string): Promise<Address> {
  return api.patch<Address>(`/addresses/${id}/set-default-billing`);
}

export async function lookupCep(cep: string): Promise<{
  street: string;
  neighborhood: string;
  city: string;
  state: string;
} | null> {
  try {
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) return null;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      logradouro?: string;
      bairro?: string;
      localidade?: string;
      uf?: string;
      erro?: boolean;
    };
    if (data.erro) return null;
    return {
      street: data.logradouro ?? '',
      neighborhood: data.bairro ?? '',
      city: data.localidade ?? '',
      state: data.uf ?? '',
    };
  } catch {
    return null;
  }
}
