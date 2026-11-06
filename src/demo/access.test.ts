import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { demoAccountAllowed, demoEnabled } from './config';
import {
  correctDemoCode,
  createDemoAccessToken,
  validDemoAccessToken,
  DEMO_ACCESS_SECONDS,
} from './access-token';
import { requireDemoAccess, requireDemoMode } from './access';

vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => undefined }) }));
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('404');
  },
}));
beforeEach(() => {
  vi.stubEnv('DEMO_MODE', 'true');
  vi.stubEnv('DEMO_ACCESS_CODE', 'test-preview-code');
  vi.stubEnv('AUTH_SECRET', 'test-signing-secret');
});
afterEach(() => vi.unstubAllEnvs());
describe('demo access boundary', () => {
  it.each(['false', '', 'TRUE', '1'])(
    'is disabled unless the flag is exactly true (%s)',
    (value) => {
      vi.stubEnv('DEMO_MODE', value);
      expect(demoEnabled()).toBe(false);
      expect(() => requireDemoMode()).toThrow('404');
      expect(demoAccountAllowed(false)).toBe(true);
      expect(demoAccountAllowed(true)).toBe(false);
    },
  );
  it('fails closed when the access code is missing', () => {
    vi.stubEnv('DEMO_ACCESS_CODE', '');
    expect(() => requireDemoMode()).toThrow('404');
    expect(correctDemoCode('')).toBe(false);
  });
  it('does not allow real accounts in demo mode', () => {
    expect(demoAccountAllowed(false)).toBe(false);
    expect(demoAccountAllowed(true)).toBe(true);
  });
  it('requires the code even when demo mode is enabled', async () => {
    expect(correctDemoCode('wrong')).toBe(false);
    expect(correctDemoCode('test-preview-code')).toBe(true);
    await expect(requireDemoAccess()).rejects.toThrow('404');
  });
  it('rejects forged, expired and rotated grants and never includes the access code in the cookie', () => {
    const now = Date.UTC(2026, 10, 6, 10);
    const token = createDemoAccessToken(now);
    expect(token).not.toContain('test-preview-code');
    expect(validDemoAccessToken(token, now)).toBe(true);
    expect(validDemoAccessToken(`${token.slice(0, -1)}x`, now)).toBe(false);
    expect(validDemoAccessToken(token, now + DEMO_ACCESS_SECONDS * 1000)).toBe(false);
    vi.stubEnv('DEMO_ACCESS_CODE', 'rotated-code');
    expect(validDemoAccessToken(token, now)).toBe(false);
    vi.stubEnv('DEMO_MODE', 'false');
    expect(validDemoAccessToken(token, now)).toBe(false);
  });
});
