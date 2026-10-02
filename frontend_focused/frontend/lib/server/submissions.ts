import type {
  Broker,
  PaginatedResponse,
  SubmissionDetail,
  SubmissionListFilters,
  SubmissionListItem,
} from '@/lib/types';

export type ServerApiResult<T> = { ok: true; data: T } | { ok: false; status: number | null };

function apiUrl(path: string): string {
  const baseUrl = (
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    'http://localhost:8000/api'
  ).replace(/\/+$/, '');
  return `${baseUrl}${path}`;
}

async function getJson<T>(path: string): Promise<ServerApiResult<T>> {
  try {
    const response = await fetch(apiUrl(path), {
      cache: 'no-store',
      headers: { accept: 'application/json' },
    });
    if (!response.ok) return { ok: false, status: response.status };
    return { ok: true, data: (await response.json()) as T };
  } catch {
    return { ok: false, status: null };
  }
}

export function getSubmissions(
  filters: SubmissionListFilters & { page: number },
): Promise<ServerApiResult<PaginatedResponse<SubmissionListItem>>> {
  const params = new URLSearchParams();

  if (filters.status) params.set('status', filters.status);
  if (filters.brokerId) params.set('brokerId', filters.brokerId);
  if (filters.companySearch) params.set('companySearch', filters.companySearch);
  if (filters.page > 1) params.set('page', String(filters.page));

  const query = params.toString();
  return getJson(`/submissions/${query ? `?${query}` : ''}`);
}

export function getBrokers(): Promise<ServerApiResult<Broker[]>> {
  return getJson('/brokers/');
}

export function getSubmissionDetail(id: string): Promise<ServerApiResult<SubmissionDetail>> {
  return getJson(`/submissions/${encodeURIComponent(id)}/`);
}
