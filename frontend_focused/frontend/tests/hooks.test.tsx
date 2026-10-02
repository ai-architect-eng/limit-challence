import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/lib/api-client';
import { useSubmissionsList, useSubmissionDetail } from '@/lib/hooks/useSubmissions';
import { useBrokerOptions } from '@/lib/hooks/useBrokerOptions';
import { brokers, detailItem, listItem, response } from './fixtures';
import { queryWrapper } from './query-wrapper';

describe('submission query hooks', () => {
  it('fetches list filters and page and forwards cancellation', async () => {
    const page = { count: 1, next: null, previous: null, results: [listItem()] };
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue(response(page));
    const filters = { status: 'new' as const, brokerId: '1', companySearch: 'Acme', page: 2 };
    const { result } = renderHook(() => useSubmissionsList(filters), { wrapper: queryWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(get).toHaveBeenCalledWith('/submissions/', {
      params: filters,
      signal: expect.any(AbortSignal),
    });
    expect(result.current.data).toEqual(page);
  });
  it('refetches when page changes', async () => {
    const get = vi
      .spyOn(apiClient, 'get')
      .mockResolvedValue(response({ count: 0, next: null, previous: null, results: [] }));
    const { result, rerender } = renderHook(({ page }) => useSubmissionsList({ page }), {
      initialProps: { page: 1 },
      wrapper: queryWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    rerender({ page: 2 });
    await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
    expect(get.mock.calls[1][1]?.params).toEqual({ page: 2 });
  });
  it('fetches detail and forwards cancellation', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue(response(detailItem()));
    const { result } = renderHook(() => useSubmissionDetail('1'), { wrapper: queryWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(get).toHaveBeenCalledWith('/submissions/1/', { signal: expect.any(AbortSignal) });
  });
  it('does not request an invalid detail id', () => {
    const get = vi.spyOn(apiClient, 'get');
    renderHook(() => useSubmissionDetail('bad'), { wrapper: queryWrapper() });
    expect(get).not.toHaveBeenCalled();
  });
  it('enables broker fetching', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue(response(brokers));
    const { result } = renderHook(() => useBrokerOptions(), { wrapper: queryWrapper() });
    await waitFor(() => expect(result.current.data).toEqual(brokers));
    expect(get).toHaveBeenCalledWith('/brokers/', { signal: expect.any(AbortSignal) });
  });
  it('exposes network failure rather than treating it as an empty page', async () => {
    vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Network unavailable'));
    const { result } = renderHook(() => useSubmissionsList({ page: 1 }), {
      wrapper: queryWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });
});
