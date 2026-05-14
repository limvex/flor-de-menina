import { NextResponse } from 'next/server';
import { clientEnv, getServerEnv } from '@/lib/env';

export async function GET() {
  const apiBase = getServerEnv().INTERNAL_API_URL ?? clientEnv.NEXT_PUBLIC_API_URL;
  const healthUrl = `${apiBase.replace(/\/$/, '')}/health`;

  let apiReachable = false;
  try {
    const r = await fetch(healthUrl, {
      signal: AbortSignal.timeout(3000),
      cache: 'no-store',
    });
    apiReachable = r.ok;
  } catch {
    apiReachable = false;
  }

  const body = {
    status: apiReachable ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? '0.1.0',
    apiReachable,
  };

  return NextResponse.json(body, { status: apiReachable ? 200 : 503 });
}
