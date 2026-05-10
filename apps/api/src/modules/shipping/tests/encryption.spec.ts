// configura ENCRYPTION_KEY antes dos imports que podem acionar o módulo
process.env.ENCRYPTION_KEY = 'a'.repeat(64);

import { encrypt, decrypt } from '../utils/encryption.util';

describe('encrypt / decrypt', () => {
  it('encrypt → decrypt retorna o original', () => {
    const original = 'meu-access-token-secreto-12345';
    const encrypted = encrypt(original);
    expect(decrypt(encrypted)).toBe(original);
  });

  it('texto cifrado é diferente do original', () => {
    const original = 'token-visivel';
    const encrypted = encrypt(original);
    expect(encrypted).not.toBe(original);
    expect(encrypted).not.toContain(original);
  });

  it('duas cifragens do mesmo texto produzem resultados diferentes (IV aleatório)', () => {
    const original = 'token-repetido';
    const enc1 = encrypt(original);
    const enc2 = encrypt(original);
    expect(enc1).not.toBe(enc2);
    expect(decrypt(enc1)).toBe(original);
    expect(decrypt(enc2)).toBe(original);
  });

  it('formato tem 3 partes separadas por ":"', () => {
    const encrypted = encrypt('test');
    const parts = encrypted.split(':');
    expect(parts).toHaveLength(3);
    expect(parts[0]).toHaveLength(24); // IV: 12 bytes em hex = 24 chars
    expect(parts[1]).toHaveLength(32); // authTag: 16 bytes em hex = 32 chars
  });

  it('lança erro com ENCRYPTION_KEY inválida', () => {
    const original = process.env.ENCRYPTION_KEY;
    process.env.ENCRYPTION_KEY = 'curta';
    expect(() => encrypt('algo')).toThrow();
    process.env.ENCRYPTION_KEY = original;
  });
});
