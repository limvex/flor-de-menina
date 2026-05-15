import { getAuthCookieOptions, getClearCookieOptions } from './cookie';

describe('auth cookie helpers', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.COOKIE_DOMAIN;
    process.env.NODE_ENV = 'development';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('getAuthCookieOptions sem COOKIE_DOMAIN não define domain', () => {
    const opts = getAuthCookieOptions(900_000);
    expect(opts.domain).toBeUndefined();
    expect(opts.httpOnly).toBe(true);
    expect(opts.sameSite).toBe('lax');
    expect(opts.secure).toBe(false);
    expect(opts.maxAge).toBe(900_000);
    expect(opts.path).toBe('/');
  });

  it('getAuthCookieOptions com COOKIE_DOMAIN define domain', () => {
    process.env.COOKIE_DOMAIN = '.flordemenina.store';
    const opts = getAuthCookieOptions(900_000, '/auth/admin/refresh');
    expect(opts.domain).toBe('.flordemenina.store');
    expect(opts.path).toBe('/auth/admin/refresh');
  });

  it('getAuthCookieOptions em produção usa secure', () => {
    process.env.NODE_ENV = 'production';
    const opts = getAuthCookieOptions(900_000);
    expect(opts.secure).toBe(true);
  });

  it('getClearCookieOptions espelha domain e path', () => {
    process.env.COOKIE_DOMAIN = '.flordemenina.store';
    const opts = getClearCookieOptions('/auth/customer/refresh');
    expect(opts.domain).toBe('.flordemenina.store');
    expect(opts.path).toBe('/auth/customer/refresh');
  });
});
