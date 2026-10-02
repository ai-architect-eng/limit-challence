import { expect, it } from 'vitest';
import { formatDate } from '@/lib/format-date';

it('formats the same UTC date in all machine timezones', () => {
  expect(formatDate('2026-09-01T23:59:00Z')).toBe('Sep 1, 2026');
});
it('does not crash on an invalid date', () => {
  expect(formatDate('bad')).toBe('Unknown date');
});
