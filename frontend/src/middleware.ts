import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_ROUTES = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

  // En prod, laisse passer — la protection se fait côté client
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.next();
  }

  const token = request.cookies.get('accessToken')?.value;

  if (!token && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token && isPublic) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};