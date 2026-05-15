# Spec — Fix cookie domain admin/customer

## Contexto

Cookies setados sem atributo `domain` viram hostOnly, não cobrem subdomínios.

## Solução

1. Centralizar options de cookie em helper `getAuthCookieOptions()` em `apps/api/src/auth/helpers/cookie.ts`
2. Helper lê `COOKIE_DOMAIN` do env e adiciona se presente
3. Todos os `res.cookie()` e `res.clearCookie()` usam o helper
4. Em dev (sem COOKIE_DOMAIN), comportamento atual mantido (sem domain)
5. Em prod (com `COOKIE_DOMAIN=.flordemenina.store`), cookie vale pra todos subdomínios

## Helper

```typescript
// apps/api/src/auth/helpers/cookie.ts
import { CookieOptions } from 'express';

export function getAuthCookieOptions(maxAgeMs: number, path = '/'): CookieOptions {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieDomain = process.env.COOKIE_DOMAIN?.trim();

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path,
    ...(cookieDomain ? { domain: cookieDomain } : {}),
    maxAge: maxAgeMs,
  };
}

export function getClearCookieOptions(path = '/'): CookieOptions {
  const cookieDomain = process.env.COOKIE_DOMAIN?.trim();

  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path,
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  };
}
```

## Validação esperada

- Em dev: cookie sem domain (funciona como antes em localhost)
- Em prod com `COOKIE_DOMAIN=.flordemenina.store`:
  - Cookie tem `Domain=.flordemenina.store`
  - `hostOnly: false`
  - Enviado em requests pra `api.flordemenina.store`
