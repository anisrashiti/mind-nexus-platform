import 'server-only';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { demoConfigured, demoAccessCookieName, validDemoAccessToken } from './access-token';
import { demoAccountAllowed } from './config';
import { isDemoDatabase } from './isolation';

export function requireDemoMode() {
  if (!demoConfigured()) notFound();
}
export async function hasDemoAccess() {
  return validDemoAccessToken((await cookies()).get(demoAccessCookieName())?.value);
}
export async function requireDemoAccess() {
  requireDemoMode();
  if (!(await hasDemoAccess())) notFound();
}
export async function allowDemoUser(user: { isDemo: boolean }) {
  if (!demoAccountAllowed(user.isDemo)) return false;
  return !user.isDemo || ((await hasDemoAccess()) && (await isDemoDatabase()));
}
