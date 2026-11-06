import { describe, it, expect } from 'vitest';
import { privateDatabaseError, protectDatabase } from './privacy';
describe('private database errors', () => {
  it('removes SQL parameters and driver details but preserves the error code', () => {
    class DrizzleQueryError extends Error {
      cause = { code: '23P01' };
    }
    const original = new DrizzleQueryError('Failed query with secret email and name');
    const safe = privateDatabaseError(original) as Error & { code: string };
    expect(safe.message).toBe('Database operation failed');
    expect(safe.code).toBe('23P01');
    expect(String(safe)).not.toContain('secret');
    expect('cause' in safe).toBe(false);
  });
  it('preserves non-database application errors', () => {
    const error = new Error('consentRequired');
    expect(privateDatabaseError(error)).toBe(error);
  });
  it('protects awaited query chains', async () => {
    class PostgresError extends Error {
      code = '23505';
    }
    const builder = {
      from() {
        return this;
      },
      then(resolve: (value: unknown) => unknown, reject: (error: unknown) => unknown) {
        return Promise.reject(new PostgresError('private query')).then(resolve, reject);
      },
    };
    await expect(Promise.resolve(protectDatabase(builder).from())).rejects.toMatchObject({
      message: 'Database operation failed',
      code: '23505',
    });
  });
});
