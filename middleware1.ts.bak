import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const token = req.cookies.get('linkmint_token')?.value;

  // If no token, redirect to login
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Allow through if token exists
  return NextResponse.next();
}

// Apply middleware only to /dashboard and future protected routes
export const config = {
  matcher: ['/dashboard/:path*'],
};
