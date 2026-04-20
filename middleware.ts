import { NextRequest, NextResponse } from 'next/server';

const PORTAL_PASSWORD = process.env.PORTAL_PASSWORD || 'ceto2026';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith('/portal')) {
    return NextResponse.next();
  }

  const auth = req.cookies.get('portal_auth')?.value;
  if (auth === PORTAL_PASSWORD) {
    return NextResponse.next();
  }

  if (pathname === '/portal/login') {
    return NextResponse.next();
  }

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = '/portal/login';
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/portal/:path*'],
};
