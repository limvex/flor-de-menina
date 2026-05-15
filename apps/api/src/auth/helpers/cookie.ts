import { CookieOptions } from 'express';

function resolveCookieDomain(): string | undefined {
  const domain = process.env.COOKIE_DOMAIN?.trim();
  return domain || undefined;
}

export function getAuthCookieOptions(
  maxAgeMs: number,
  path = '/',
): CookieOptions {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieDomain = resolveCookieDomain();

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path,
    maxAge: maxAgeMs,
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  };
}

export function getClearCookieOptions(path = '/'): CookieOptions {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieDomain = resolveCookieDomain();

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path,
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  };
}
