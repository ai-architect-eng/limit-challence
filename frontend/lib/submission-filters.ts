import type { SubmissionListFilters, SubmissionStatus } from '@/lib/types';

export type ListState = SubmissionListFilters & { page: number };
const statuses: readonly string[] = ['new', 'in_review', 'closed', 'lost'];

function positiveInteger(value: string | null): number | undefined {
  if (!value || !/^[1-9]\d*$/.test(value)) return undefined;
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : undefined;
}

export function readFilters(params: Pick<URLSearchParams, 'get'>): ListState {
  const status = params.get('status');
  const brokerId = positiveInteger(params.get('brokerId'));
  const companySearch = params.get('companySearch')?.trim();
  return {
    ...(status && statuses.includes(status) ? { status: status as SubmissionStatus } : {}),
    ...(brokerId ? { brokerId: String(brokerId) } : {}),
    ...(companySearch ? { companySearch } : {}),
    page: positiveInteger(params.get('page')) ?? 1,
  };
}

export function listUrl(filters: SubmissionListFilters): string {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.brokerId) params.set('brokerId', filters.brokerId);
  if (filters.companySearch?.trim()) params.set('companySearch', filters.companySearch.trim());
  if (filters.page && filters.page > 1) params.set('page', String(filters.page));
  const query = params.toString();
  return `/submissions${query ? `?${query}` : ''}`;
}
