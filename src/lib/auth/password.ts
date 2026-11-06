import { z } from 'zod';
const common = new Set([
  'password',
  'password123',
  'password1234',
  '1234567890',
  '12345678910',
  'qwerty12345',
  'qwertyuiop',
  'letmein1234',
  'welcome123',
  'welcome1234',
  'mindnexus123',
  'iloveyou123',
  'admin12345',
]);
export const passwordRules = (value: string) => ({
  length: value.length >= 10,
  number: /\d/.test(value),
  uncommon: !!value && !common.has(value.toLowerCase()),
});
export const passwordSchema = z
  .string()
  .min(10)
  .max(128)
  .refine((value) => /\d/.test(value))
  .refine((value) => !common.has(value.toLowerCase()));
export const emailSchema = z
  .email()
  .max(254)
  .transform((value) => value.trim().toLowerCase());
export const tokenSchema = z.string().regex(/^[a-f0-9]{64}$/);
