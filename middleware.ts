import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith('/portal') && !pathname.startsWith('/portal/login')) {
    const auth = req.cookies.get('ceto_portal_auth');
    if (!auth || auth.value !== 'authenticated') {
      return NextResponse.redirect(new URL('/portal/login', req.url));
    }
  }
  return NextResponse.next();
}

export const config = { matcher: ['/portal/:path*'] };
