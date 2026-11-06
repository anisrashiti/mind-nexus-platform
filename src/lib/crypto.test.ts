import { describe, it, expect, beforeEach } from 'vitest';
import { encrypt, decrypt, newToken, hashToken, constantEqual } from './crypto';
beforeEach(() => {
  process.env.ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
});
describe('sensitive fields', () => {
  it('encrypts with a unique IV and authenticates', () => {
    const a = encrypt('private');
    const b = encrypt('private');
    expect(a).not.toBe(b);
    expect(decrypt(a)).toBe('private');
    expect(a).not.toContain('private');
    const parts = a.split('.');
    parts[3] = Buffer.from('tampered').toString('base64');
    expect(() => decrypt(parts.join('.'))).toThrow();
  });
  it('fails closed for an invalid key', () => {
    process.env.ENCRYPTION_KEY = 'bad';
    expect(() => encrypt('x')).toThrow();
  });
  it('uses 32 random bytes and one-way token hashes', () => {
    const a = newToken();
    expect(a).toHaveLength(64);
    expect(hashToken(a)).toHaveLength(64);
    expect(hashToken(a)).not.toBe(a);
    expect(constantEqual(a, a)).toBe(true);
    expect(constantEqual(a, a + 'x')).toBe(false);
  });
});
