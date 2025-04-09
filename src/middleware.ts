import { NextRequest, NextResponse } from 'next/server';

import { getSessionCookie } from 'better-auth/cookies';

const ADMIN_URL = '/admin';
const AUTH_URL = '/auth';

export const middleware = (request: NextRequest) => {
  if (request.nextUrl.pathname.startsWith(ADMIN_URL)) {
    // protect admin page
    const sessionCookie = getSessionCookie(request);
    if (!sessionCookie) {
      const url = new URL(AUTH_URL, request.url);
      url.searchParams.set('callbackURL', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  } else if (request.nextUrl.pathname.startsWith(AUTH_URL)) {
    // protect auth page
    const sessionCookie = getSessionCookie(request);
    if (sessionCookie) {
      return NextResponse.redirect(new URL(ADMIN_URL, request.url));
    }
  }
};

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
