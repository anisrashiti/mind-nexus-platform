import { describe, it, expect } from 'vitest';
import { passwordSchema, passwordRules, tokenSchema } from './password';
describe('password and tokens', () => {
  it('rejects common, short and numberless passwords', () => {
    for (const p of ['password123', 'Welcome1234', 'abc1', 'averylongpassword'])
      expect(passwordSchema.safeParse(p).success).toBe(false);
    expect(passwordSchema.safeParse('QuietRiver482!').success).toBe(true);
  });
  it('exposes the same rules for live validation', () =>
    expect(passwordRules('QuietRiver482!')).toEqual({
      length: true,
      number: true,
      uncommon: true,
    }));
  it('requires a 32-byte hex token', () => {
    expect(tokenSchema.safeParse('a'.repeat(64)).success).toBe(true);
    expect(tokenSchema.safeParse('../token').success).toBe(false);
  });
});
