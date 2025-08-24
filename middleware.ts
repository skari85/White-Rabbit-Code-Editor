import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/') {
    const seen = request.cookies.get('wr_seen_landing')?.value;
    if (!seen) {
      const url = request.nextUrl.clone();
      url.pathname = '/landing';
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/'],
};


