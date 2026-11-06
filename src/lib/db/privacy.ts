import { DrizzleQueryError } from 'drizzle-orm';
/** Keep Drizzle's query text/parameters and driver connection details out of framework error logs. */
export function privateDatabaseError(error: unknown): unknown {
  if (!(error instanceof Error)) return error;
  const candidate = error as Error & { code?: string; cause?: { code?: string } };
  if (
    !(error instanceof DrizzleQueryError) &&
    !['DrizzleQueryError', 'PostgresError'].includes(error.constructor.name) &&
    !('severity_local' in error && candidate.code)
  )
    return error;
  const safe = new Error('Database operation failed') as Error & { code?: string };
  safe.name = 'DatabaseFailure';
  safe.code = candidate.cause?.code ?? candidate.code;
  return safe;
}
export function protectDatabase<T extends object>(target: T): T {
  return new Proxy(target, {
    get(object, property, receiver) {
      const value = Reflect.get(object, property, receiver);
      if (property === '$client') return value;
      if (property === 'then' && typeof value === 'function')
        return (resolve: unknown, reject: unknown) =>
          Promise.resolve(object)
            .catch((error) => {
              throw privateDatabaseError(error);
            })
            .then(resolve as (v: unknown) => unknown, reject as (e: unknown) => unknown);
      if (property === 'transaction' && typeof value === 'function')
        return (callback: (tx: unknown) => unknown, config?: unknown) =>
          Reflect.apply(value, object, [
            (tx: object) => callback(protectDatabase(tx)),
            config,
          ]).catch((error: unknown) => {
            throw privateDatabaseError(error);
          });
      if (typeof value !== 'function') return value;
      return (...args: unknown[]) => {
        try {
          const result = Reflect.apply(value, object, args);
          return result && typeof result === 'object' ? protectDatabase(result) : result;
        } catch (error) {
          throw privateDatabaseError(error);
        }
      };
    },
  });
}
