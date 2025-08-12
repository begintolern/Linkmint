import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const CANONICAL_HOST = 'linkmint.co';
const ALLOWED_HOSTS = new Set([
  CANONICAL_HOST,
  'www.linkmint.co',
  'linkmint-production.up.railway.app', // allow Railway host
  'localhost:3000',
]);

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') ?? '';
  const path = req.nextUrl.pathname;

  // Always allow diagnostics
  if (path.startsWith('/api/health') || path.startsWith('/api/diag')) {
    return NextResponse.next();
  }

  // Unknown hosts -> redirect to canonical
  if (!ALLOWED_HOSTS.has(host)) {
    const url = new URL(req.url);
    url.protocol = 'https:';
    url.host = CANONICAL_HOST;
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
