import { describe, expect, it } from 'vitest';
import { listUrl, readFilters } from '@/lib/submission-filters';

describe('submission URL state', () => {
  it('reads filters and page from a deep link', () => {
    expect(
      readFilters(
        new URLSearchParams('status=in_review&brokerId=2&companySearch=%20Acme%20&page=3'),
      ),
    ).toEqual({ status: 'in_review', brokerId: '2', companySearch: 'Acme', page: 3 });
  });
  it('normalizes invalid and blank values', () => {
    expect(
      readFilters(new URLSearchParams('status=wrong&brokerId=abc&companySearch=%20&page=-1')),
    ).toEqual({ page: 1 });
    expect(readFilters(new URLSearchParams('brokerId=1.5&page=2.5'))).toEqual({ page: 1 });
    expect(readFilters(new URLSearchParams('page=9007199254740992'))).toEqual({ page: 1 });
  });
  it('omits defaults and URL-encodes company names', () => {
    expect(listUrl({ page: 1 })).toBe('/submissions');
    expect(listUrl({ status: 'new', brokerId: '2', companySearch: 'A & B', page: 2 })).toBe(
      '/submissions?status=new&brokerId=2&companySearch=A+%26+B&page=2',
    );
  });
});
