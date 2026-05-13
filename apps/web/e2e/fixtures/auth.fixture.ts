import { type BrowserContext, type APIRequestContext } from '@playwright/test';
import { existsSync, readFileSync } from 'fs';
import { QA_USER, AUTH_CACHE_PATH } from '../global-setup';

const API = 'http://localhost:3333';

type Cookie = {
  name: string;
  value: string;
  domain: string;
  path: string;
  httpOnly: boolean;
  sameSite: 'Lax' | 'Strict' | 'None';
};

interface AuthCache {
  customerToken: string;
  customerCookies: Cookie[];
  adminToken: string;
}

// Cache em memória por processo (dentro do mesmo arquivo de teste)
let _cachedCustomerToken: string | null = null;
let _cachedCookies: Cookie[] | null = null;
let _cachedAdminToken: string | null = null;

function readAuthCache(): AuthCache | null {
  if (!existsSync(AUTH_CACHE_PATH)) return null;
  try {
    return JSON.parse(readFileSync(AUTH_CACHE_PATH, 'utf-8')) as AuthCache;
  } catch {
    return null;
  }
}

async function doCustomerLogin(api: APIRequestContext) {
  // 1. Cache em memória (dentro do processo/arquivo de teste)
  if (_cachedCustomerToken && _cachedCookies) {
    return { token: _cachedCustomerToken, cookies: _cachedCookies };
  }

  // 2. Cache em arquivo (gravado pelo global-setup, compartilhado entre processos)
  const fileCache = readAuthCache();
  if (fileCache?.customerToken && fileCache.customerCookies?.length > 0) {
    _cachedCustomerToken = fileCache.customerToken;
    _cachedCookies = fileCache.customerCookies;
    return { token: _cachedCustomerToken, cookies: _cachedCookies };
  }

  // 3. Fallback: login real (só ocorre se o global-setup não gerou o cache)
  const res = await api.post(`${API}/auth/customer/login`, {
    data: { email: QA_USER.email, password: QA_USER.password },
  });
  if (!res.ok()) {
    throw new Error(`Login QA falhou: ${res.status()} ${await res.text()}`);
  }
  const raw = res.headers()['set-cookie'] ?? '';
  const cookies = parseSetCookieHeader(raw);
  const match = raw.match(/flor_customer_token=([^;]+)/);
  const token = match?.[1] ?? '';
  if (!token) throw new Error('Cookie flor_customer_token não encontrado');
  _cachedCustomerToken = token;
  _cachedCookies = cookies;
  return { token, cookies };
}

/** Loga o usuário QA via API e injeta os cookies no contexto do browser. */
export async function loginAsQaUser(context: BrowserContext, api: APIRequestContext) {
  const { cookies } = await doCustomerLogin(api);
  if (cookies.length > 0) {
    await context.addCookies(cookies);
  }
}

/** Loga como admin via API e retorna o access_token (cacheado por processo). */
export async function getAdminToken(api: APIRequestContext): Promise<string> {
  if (_cachedAdminToken) return _cachedAdminToken;

  // Tenta cache de arquivo antes de fazer login real
  const fileCache = readAuthCache();
  if (fileCache?.adminToken) {
    _cachedAdminToken = fileCache.adminToken;
    return _cachedAdminToken;
  }

  const res = await api.post(`${API}/auth/admin/login`, {
    data: { email: 'admin@flordemenina.store', password: 'admin123' },
  });
  if (!res.ok()) throw new Error(`Admin login falhou: ${res.status()}`);
  const body = (await res.json()) as { access_token: string };
  _cachedAdminToken = body.access_token;
  return _cachedAdminToken;
}

/** Obtém token de cliente QA para chamadas diretas à API (cacheado por processo). */
export async function getQaCustomerToken(api: APIRequestContext): Promise<string> {
  const { token } = await doCustomerLogin(api);
  return token;
}

function parseSetCookieHeader(raw: string): Cookie[] {
  const cookies: Cookie[] = [];
  const parts = raw.split(/,(?=[^\s])/);
  for (const part of parts) {
    const segments = part.split(';').map((s) => s.trim());
    const [nameVal] = segments;
    if (!nameVal?.includes('=')) continue;
    const eqIdx = nameVal.indexOf('=');
    const name = nameVal.slice(0, eqIdx).trim();
    const value = nameVal.slice(eqIdx + 1).trim();
    if (!name || !value || value === '') continue;
    cookies.push({ name, value, domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Lax' });
  }
  return cookies;
}
