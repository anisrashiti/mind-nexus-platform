import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';
import {
  validWherebySignature,
  participantExternalId,
  participantMetadata,
  verifyParticipantMetadata,
} from './signature';
describe('Whereby webhook authentication', () => {
  const now = 1800000000000;
  const t = String(now / 1000),
    secret = 'test-secret',
    body = '{"type":"room.client.joined"}';
  const sign = (raw: string, time = t) =>
    `t=${time},v1=${createHmac('sha256', secret).update(`${time}.${raw}`).digest('hex')}`;
  it('authenticates exact raw bytes and rejects tampering', () => {
    expect(validWherebySignature(body, sign(body), secret, now)).toBe(true);
    expect(validWherebySignature(body + ' ', sign(body), secret, now)).toBe(false);
  });
  it('rejects expired, future and malformed signatures', () => {
    expect(validWherebySignature(body, sign(body, String(+t - 301)), secret, now)).toBe(false);
    expect(validWherebySignature(body, sign(body, String(+t + 301)), secret, now)).toBe(false);
    expect(validWherebySignature(body, 't=1,v1=short', secret, now)).toBe(false);
  });
  it('signs participant roles and uses valid external IDs', () => {
    process.env.AUTH_SECRET = 'qa-test-key';
    const id = '11111111-1111-4111-8111-111111111111';
    const metadata = participantMetadata(id, 'employee');
    expect(verifyParticipantMetadata(metadata, id, 'employee')).toBe(true);
    expect(verifyParticipantMetadata(metadata, id, 'psychologist')).toBe(false);
    expect(participantExternalId(id, 'employee')).toMatch(/^[A-Za-z0-9_-]{1,36}$/);
  });
});
