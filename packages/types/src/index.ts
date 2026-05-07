export type Money = number;

export type ID = string;

export type Pagination = {
  page: number;
  limit: number;
  total: number;
};

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'OPERATOR';
};
