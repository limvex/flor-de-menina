import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_ADMIN_PATHS = ['/admin/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/admin')) return NextResponse.next();
  if (PUBLIC_ADMIN_PATHS.includes(pathname)) return NextResponse.next();

  const accessToken = request.cookies.get('access_token');
  if (!accessToken) {
    const loginUrl = new URL('/admin/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
