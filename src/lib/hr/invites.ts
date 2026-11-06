import { z } from 'zod';
export function parseInviteEmails(value: string) {
  const parts = [
    ...new Set(
      value
        .split(/[\s,;]+/)
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
  return {
    emails: parts.filter((email) => z.email().safeParse(email).success),
    invalid: parts.filter((email) => !z.email().safeParse(email).success),
  };
}
