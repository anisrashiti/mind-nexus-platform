import {describe,it,expect} from 'vitest';
import {visibleUsageTotal} from './privacy';
import {parseInviteEmails} from './invites';
describe('HR privacy and invitations',()=>{it('suppresses the exact total below five',()=>{for(let i=0;i<5;i++)expect(visibleUsageTotal(i)).toBeNull();expect(visibleUsageTotal(5)).toBe(5);});it('normalizes and deduplicates pasted emails',()=>expect(parseInviteEmails('A@example.com, a@example.com\n b@example.com c@example.com')).toEqual({emails:['a@example.com','b@example.com','c@example.com'],invalid:[]}));it('keeps invalid addresses out of the invitation list',()=>expect(parseInviteEmails('bad,valid@example.com').invalid).toEqual(['bad']));});
