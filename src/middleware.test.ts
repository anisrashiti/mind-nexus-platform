import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from './middleware';
describe('no-referrer native form CSRF handling', () => {
  it('normalizes an opaque native Origin only with same-origin Fetch Metadata', () => {
    const request = new NextRequest('http://localhost:3000/login', {
      method: 'POST',
      headers: { origin: 'null', 'sec-fetch-site': 'same-origin', host: 'localhost:3000' },
    });
    const response = middleware(request);
    expect(response.status).toBe(200);
    expect(response.headers.get('x-middleware-request-origin')).toBe('http://localhost:3000');
    expect(response.headers.get('referrer-policy')).toBe('no-referrer');
  });
  it.each(['cross-site', 'same-site', 'none', undefined])(
    'rejects opaque origins from %s',
    (site) => {
      const headers: Record<string, string> = { origin: 'null', host: 'localhost:3000' };
      if (site) headers['sec-fetch-site'] = site;
      const response = middleware(
        new NextRequest('http://localhost:3000/login', { method: 'POST', headers }),
      );
      expect(response.status).toBe(403);
      expect(response.headers.get('referrer-policy')).toBe('no-referrer');
    },
  );
  it('keeps ordinary origins for the framework CSRF checks', () => {
    const response = middleware(
      new NextRequest('http://localhost:3000/login', {
        method: 'POST',
        headers: { origin: 'https://other.example', 'sec-fetch-site': 'cross-site' },
      }),
    );
    expect(response.headers.get('x-middleware-request-origin')).toBe('https://other.example');
  });
});
