import { api } from './client';

export interface GenerateDescriptionParams {
  name: string;
  categoryId: string;
  attributes?: string[];
  tone?: 'elegante' | 'casual' | 'romantica';
  length?: 'curta' | 'media' | 'longa';
}

export interface GenerateDescriptionResult {
  description: string;
  mock: boolean;
}

export interface CreditBalance {
  available: number;
  used: number;
}

export const aiApi = {
  generateDescription: (params: GenerateDescriptionParams) =>
    api.post<GenerateDescriptionResult>('/ai/generate-description', params),

  getCreditBalance: () => api.get<CreditBalance | null>('/ai/credit-balance'),
};
