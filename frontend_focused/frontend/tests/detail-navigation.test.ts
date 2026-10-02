import { expect, it } from 'vitest';
import { documentUrl, returnUrl } from '@/lib/detail-navigation';

it('preserves only local submission-list return links', () => {
  expect(returnUrl('/submissions?status=new&page=2')).toBe('/submissions?status=new&page=2');
  expect(returnUrl('/submissions?companySearch=Acme%20Inc#results')).toBe(
    '/submissions?companySearch=Acme%20Inc',
  );
  for (const value of [
    null,
    '',
    'https://evil.example/submissions',
    '//evil.example/submissions',
    '/submissions-evil',
    '/submissions/1',
    '/submissions/../admin',
    '/submissions%2f..%2fadmin',
  ]) {
    expect(returnUrl(value)).toBe('/submissions');
  }
});

it('allows only absolute HTTP(S) document links', () => {
  expect(documentUrl('https://example.com/file')).toBe('https://example.com/file');
  expect(documentUrl('http://example.com/file')).toBe('http://example.com/file');
  for (const value of [
    '',
    'javascript:alert(1)',
    'data:text/html,unsafe',
    '/local-file',
    '//example.com/file',
    'mailto:broker@example.com',
  ]) {
    expect(documentUrl(value)).toBeNull();
  }
});
