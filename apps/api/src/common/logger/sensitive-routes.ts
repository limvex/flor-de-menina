/** Prefixos de rota cujo corpo não deve aparecer em logs (apenas metadados seguros). */
export const SENSITIVE_ROUTE_SUBSTRINGS = [
  '/auth/',
  '/payments/process',
  '/webhooks/',
  '/admin/users',
] as const;

export function isSensitivePath(path: string): boolean {
  const base = path.split('?')[0] ?? path;
  return SENSITIVE_ROUTE_SUBSTRINGS.some((frag) => base.includes(frag));
}
