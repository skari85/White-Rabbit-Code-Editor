import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  // If user is navigating to root and hasn't "seen landing", send them to landing once.
  if (pathname === '/') {
    const seen = request.cookies.get('wr_seen_landing')?.value
    // Do not interfere with authenticated flows heading to editor
    const next = request.nextUrl.clone()
    if (!seen) {
      next.pathname = '/landing'
      const res = NextResponse.redirect(next)
      res.cookies.set('wr_seen_landing', '1', { path: '/', maxAge: 60 * 60 * 24 * 365 })
      return res
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/'],
};


