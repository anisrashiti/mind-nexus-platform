import { describe, it, expect } from 'vitest';
import { initials, cn } from './utils';
describe('UI helpers', () => {
  it('uses at most two initials', () => expect(initials('Luljeta Berisha')).toBe('LB'));
  it('merges conflicting utility classes', () => expect(cn('p-2', 'p-4')).toBe('p-4'));
});
