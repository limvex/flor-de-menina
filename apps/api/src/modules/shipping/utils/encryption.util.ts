import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { InternalServerErrorException } from '@nestjs/common';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new InternalServerErrorException(
      "ENCRYPTION_KEY inválida ou ausente. Gere com: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    );
  }
  return Buffer.from(hex, 'hex');
}

export function encrypt(text: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // formato: iv:authTag:ciphertext (tudo em hex)
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(encryptedText: string): string {
  const key = getKey();
  const parts = encryptedText.split(':');
  if (parts.length !== 3)
    throw new InternalServerErrorException('Formato de token inválido');

  const [ivHex, authTagHex, dataHex] = parts;
  const iv = Buffer.from(ivHex!, 'hex');
  const authTag = Buffer.from(authTagHex!, 'hex');
  const data = Buffer.from(dataHex!, 'hex');

  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  return decipher.update(data) + decipher.final('utf8');
}
