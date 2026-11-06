import 'server-only';
import { createHmac } from 'node:crypto';
import { constantEqual, hashToken } from '@/lib/crypto';
import { demoEnabled } from './config';

export const DEMO_ACCESS_SECONDS = 8 * 60 * 60;
export const demoCookieSecure = () =>
  process.env.NODE_ENV === 'production' || !!process.env.APP_URL?.startsWith('https://');
export const demoAccessCookieName = () =>
  demoCookieSecure() ? '__Secure-mn-demo-access' : 'mn-demo-access';
export const demoSessionCookieName = () =>
  demoCookieSecure() ? '__Secure-authjs.session-token' : 'authjs.session-token';
export function demoConfigured() {
  return demoEnabled() && !!process.env.DEMO_ACCESS_CODE && !!process.env.AUTH_SECRET;
}
export function correctDemoCode(value: string) {
  return (
    demoConfigured() && constantEqual(hashToken(value), hashToken(process.env.DEMO_ACCESS_CODE!))
  );
}
function signature(expires: string) {
  return createHmac('sha256', process.env.AUTH_SECRET!)
    .update(`mind-nexus-demo:${process.env.DEMO_ACCESS_CODE}:${expires}`)
    .digest('hex');
}
export function createDemoAccessToken(now = Date.now()) {
  if (!demoConfigured()) throw new Error('Demo access is not configured');
  const expires = String(now + DEMO_ACCESS_SECONDS * 1000);
  return `${expires}.${signature(expires)}`;
}
export function validDemoAccessToken(value: string | undefined, now = Date.now()) {
  if (!demoConfigured() || !value || !/^\d{13}\.[a-f0-9]{64}$/.test(value)) return false;
  const [expires, signed] = value.split('.');
  const remaining = Number(expires) - now;
  return (
    remaining > 0 &&
    remaining <= DEMO_ACCESS_SECONDS * 1000 &&
    constantEqual(signed, signature(expires))
  );
}
