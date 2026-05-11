const SENSITIVE_KEYS = [
  'cardnumber',
  'card_number',
  'cvv',
  'security_code',
  'access_token',
  'accesstoken',
  'authorization',
  'api_key',
  'apikey',
  'mp_access_token',
  'mp_webhook_secret',
];

export function sanitizeForLog(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return (obj as unknown[]).map(sanitizeForLog);
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const keyLower = key.toLowerCase();
    if (SENSITIVE_KEYS.some((s) => keyLower.includes(s))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeForLog(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}
