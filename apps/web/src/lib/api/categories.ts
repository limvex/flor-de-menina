import { api } from './client';

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
}

export const categoriesApi = {
  list: () => api.get<Category[]>('/categories'),
  listAdmin: () => api.get<Category[]>('/admin/categories'),
};
