import { NextRequest, NextResponse } from 'next/server';
import { getServerEnv } from '@/lib/env';
import { clientEnv } from '@/lib/env';

export async function POST(req: NextRequest) {
  const apiBase = getServerEnv().INTERNAL_API_URL ?? clientEnv.NEXT_PUBLIC_API_URL;
  const target = `${apiBase.replace(/\/$/, '')}/webhooks/mercado-pago`;

  const body = await req.text();
  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    if (!['host', 'connection'].includes(key)) headers[key] = value;
  });

  const response = await fetch(target, {
    method: 'POST',
    headers,
    body,
  });

  const resBody = await response.text();
  return new NextResponse(resBody, { status: response.status });
}
