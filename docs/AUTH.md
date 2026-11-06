# Credentials and revocable database sessions

Auth.js v5 rejects a Credentials provider unless `session.strategy` is `jwt` ([official error reference](https://authjs.dev/reference/core/errors#unsupportedstrategy)). To retain the requested database-session behavior, the JWT encode/decode hooks implement an opaque random 32-byte session token. No identity or role is encoded in the cookie. Postgres stores only its SHA-256 digest, user ID and expiry. Decode requires an unexpired database row and active user; guards recheck the live user, role and organization. Sign-out and password reset revoke database rows immediately.

TODO(question): Confirm this compatibility approach with the client; changing to Auth.js's built-in JWT-only persistence would change the database-session requirement. OAuth/public registration are not enabled. Invite/reset tokens are independent, random, hashed and single-use.

Configure `AUTH_SECRET`, `APP_URL` and the EU database before login. HTTPS sets a Secure, HttpOnly, SameSite=Lax session cookie. Local HTTP uses the development cookie so smoke tests can run. Forwarded-IP rate limiting assumes Vercel's trusted proxy; use a trusted proxy that overwrites forwarded headers on any other host.

The required `Referrer-Policy: no-referrer` can make native HTML form POSTs carry `Origin: null` before JavaScript hydration. Next.js 15 otherwise attempts to parse that literal as a URL. Middleware normalizes it to the request origin only when browser-controlled `Sec-Fetch-Site` is exactly `same-origin`; opaque origins from cross-site, same-site or missing metadata are rejected with 403. Ordinary origins still pass through Next.js's CSRF checks. Unit tests cover both normalization and rejection, and native employee login is checked with JavaScript disabled.
