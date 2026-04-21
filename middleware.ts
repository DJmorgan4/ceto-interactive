import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith('/portal')) return NextResponse.next();
  if (pathname === '/portal/login') return NextResponse.next();

  const portalPassword = process.env.PORTAL_PASSWORD;
  if (!portalPassword) {
    return new NextResponse('Portal unavailable', { status: 503 });
  }

  const auth = req.cookies.get('portal_auth')?.value;
  if (auth && auth === portalPassword) return NextResponse.next();

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = '/portal/login';
  loginUrl.searchParams.set('from', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/portal/:path*'],
};
