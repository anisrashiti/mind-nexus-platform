import { NextResponse, type NextRequest } from 'next/server';
export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const dev = process.env.NODE_ENV === 'development';
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'" + (dev ? ' ws:' : ''),
    'frame-src https://*.whereby.com https://whereby.com',
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(dev ? [] : ['upgrade-insecure-requests']),
  ].join('; ');
  const headers = new Headers(request.headers);
  // Native form POSTs under no-referrer can have Origin: null before React hydrates.
  // Fetch Metadata is browser-controlled; never normalize a cross-site/unknown request.
  const nullOrigin = request.method === 'POST' && headers.get('origin') === 'null';
  const rejectNullOrigin = nullOrigin && headers.get('sec-fetch-site') !== 'same-origin';
  if (nullOrigin && !rejectNullOrigin) headers.set('origin', request.nextUrl.origin);
  headers.set('x-nonce', nonce);
  headers.set('Content-Security-Policy', csp);
  const response = rejectNullOrigin
    ? new NextResponse(null, { status: 403 })
    : NextResponse.next({ request: { headers } });
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('Referrer-Policy', 'no-referrer');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  const video = request.nextUrl.pathname.startsWith('/session/');
  response.headers.set(
    'Permissions-Policy',
    video
      ? 'camera=(self "https://*.whereby.com"), microphone=(self "https://*.whereby.com"), display-capture=()'
      : 'camera=(), microphone=(), display-capture=()',
  );
  response.headers.set('Cache-Control', 'private, no-store');
  if (!dev)
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  return response;
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.svg|logo-mark.svg).*)'] };
