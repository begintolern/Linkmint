// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const CANONICAL = 'linkmint.co'
// allow Railway’s default domain to pass without redirect
const ALLOWED = ['linkmint.co', 'www.linkmint.co', '.up.railway.app']

export function middleware(req: NextRequest) {
  const { pathname, host } = {
    pathname: req.nextUrl.pathname,
    host: req.headers.get('host') || '',
  }

  // 1) Never touch the health check
  if (pathname.startsWith('/api/health')) {
    return NextResponse.next()
  }

  // 2) If host is already allowed, do nothing
  if (ALLOWED.some(allowed => host === allowed || host.endsWith(allowed))) {
    return NextResponse.next()
  }

  // 3) Otherwise, redirect to canonical host
  const url = new URL(req.url)
  url.host = CANONICAL
  url.protocol = 'https:'
  return NextResponse.redirect(url, 308)
}

export const config = {
  matcher: [
    // run on everything except _next/static, images, and assets if you like
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
