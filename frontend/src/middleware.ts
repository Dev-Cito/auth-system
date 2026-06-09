import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_ROUTES = ['/login', '/register'];
const PROTECTED_ROUTES = ['/dashboard'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('accessToken')?.value
    ?? request.headers.get('authorization')?.split(' ')[1];

  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));
  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));

  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isPublic && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};