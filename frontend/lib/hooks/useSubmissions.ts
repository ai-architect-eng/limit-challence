'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  PaginatedResponse,
  SubmissionDetail,
  SubmissionListFilters,
  SubmissionListItem,
} from '@/lib/types';

export function useSubmissionQueryKey(filters: SubmissionListFilters) {
  return ['submissions', 'list', filters] as const;
}

export function useSubmissionsList(filters: SubmissionListFilters) {
  return useQuery({
    queryKey: useSubmissionQueryKey(filters),
    queryFn: async ({ signal }) => {
      const response = await apiClient.get<PaginatedResponse<SubmissionListItem>>('/submissions/', {
        params: filters,
        signal,
      });
      return response.data;
    },
  });
}

export function useSubmissionDetail(id: string | number) {
  const value = String(id);
  return useQuery({
    queryKey: ['submissions', 'detail', value],
    queryFn: async ({ signal }) => {
      const response = await apiClient.get<SubmissionDetail>(
        `/submissions/${encodeURIComponent(value)}/`,
        { signal },
      );
      return response.data;
    },
    enabled: /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value)),
    staleTime: 60_000,
  });
}
