'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Broker } from '@/lib/types';

export function useBrokerOptions() {
  return useQuery({
    queryKey: ['brokers'],
    queryFn: async ({ signal }) => (await apiClient.get<Broker[]>('/brokers/', { signal })).data,
    staleTime: 60_000,
  });
}
