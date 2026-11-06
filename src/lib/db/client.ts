import 'server-only';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';
import { protectDatabase } from './privacy';
const createDb = () => {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  return protectDatabase(
    drizzle(postgres(process.env.DATABASE_URL, { max: 5, prepare: false, onnotice: () => {} }), {
      schema,
    }),
  );
};
let database: ReturnType<typeof createDb> | undefined;
export const db = () => (database ??= createDb());
export type Database = ReturnType<typeof db>;
export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];
