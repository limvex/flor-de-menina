import { sanitizeForLog } from '../utils/sanitize-logs';

describe('sanitizeForLog', () => {
  it('mascara cardNumber', () => {
    const result = sanitizeForLog({
      cardNumber: '4111111111111111',
      amount: 100,
    }) as Record<string, unknown>;
    expect(result.cardNumber).toBe('[REDACTED]');
    expect(result.amount).toBe(100);
  });

  it('mascara cvv, access_token, apiKey', () => {
    const result = sanitizeForLog({
      cvv: '123',
      access_token: 'TEST-abc',
      apiKey: 'key',
      ok: 'value',
    }) as Record<string, unknown>;
    expect(result.cvv).toBe('[REDACTED]');
    expect(result.access_token).toBe('[REDACTED]');
    expect(result.apiKey).toBe('[REDACTED]');
    expect(result.ok).toBe('value');
  });

  it('recursiva em objetos aninhados', () => {
    const result = sanitizeForLog({
      data: { card_number: '4111', nested: { cvv: '123' } },
    }) as Record<string, Record<string, Record<string, unknown>>>;
    expect(result.data.card_number).toBe('[REDACTED]');
    expect(result.data.nested.cvv).toBe('[REDACTED]');
  });

  it('aceita arrays', () => {
    const result = sanitizeForLog([
      { cardNumber: '4111' },
      { ok: 1 },
    ]) as Record<string, unknown>[];
    expect(result[0].cardNumber).toBe('[REDACTED]');
    expect(result[1].ok).toBe(1);
  });

  it('passa primitivos sem mexer', () => {
    expect(sanitizeForLog('string')).toBe('string');
    expect(sanitizeForLog(123)).toBe(123);
    expect(sanitizeForLog(null)).toBe(null);
  });
});
