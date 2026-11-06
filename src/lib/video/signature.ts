import 'server-only';
import { createHmac } from 'node:crypto';
import { constantEqual, privateKey } from '@/lib/crypto';
export function validWherebySignature(
  body: string,
  header: string | null,
  secret: string,
  now = Date.now(),
) {
  if (!header || !secret) return false;
  const timestamp = header.match(/(?:^|,)\s*t=(\d+)(?:,|$)/)?.[1];
  const signatures = [...header.matchAll(/(?:^|,)\s*v1=([a-f0-9]{64})(?=,|$)/g)].map((m) => m[1]);
  if (!timestamp || !signatures.length || Math.abs(now - Number(timestamp) * 1000) > 300000)
    return false;
  const expected = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
  return signatures.some((s) => constantEqual(s, expected));
}
export function participantMetadata(id: string, role: 'employee' | 'psychologist') {
  const payload = `${id}:${role}`;
  return `${payload}:${privateKey(`whereby:${payload}`)}`;
}
export function verifyParticipantMetadata(
  metadata: string,
  id: string,
  role: 'employee' | 'psychologist',
) {
  return constantEqual(metadata, participantMetadata(id, role));
}
export const participantExternalId = (id: string, role: 'employee' | 'psychologist') =>
  `${id.replaceAll('-', '')}-${role === 'employee' ? 'e' : 'p'}`;
