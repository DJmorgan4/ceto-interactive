import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const PORTAL_PASSWORD = process.env.PORTAL_PASSWORD;
  if (!PORTAL_PASSWORD) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  if (password === PORTAL_PASSWORD) {
    const cookieStore = await cookies();
    cookieStore.set('ceto_portal_auth', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
}
