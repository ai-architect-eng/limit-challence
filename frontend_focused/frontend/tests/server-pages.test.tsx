import { beforeEach, describe, expect, it, vi } from 'vitest';
import SubmissionsPage from '@/app/submissions/page';
import SubmissionDetailPage from '@/app/submissions/[id]/page';
import { getBrokers, getSubmissionDetail, getSubmissions } from '@/lib/server/submissions';
import type { ServerApiResult } from '@/lib/server/submissions';
import type { Broker, PaginatedResponse, SubmissionListItem } from '@/lib/types';
import { brokers, detailItem, listItem } from './fixtures';

vi.mock('@/lib/server/submissions', () => ({
  getBrokers: vi.fn(),
  getSubmissionDetail: vi.fn(),
  getSubmissions: vi.fn(),
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe('server-rendered submission pages', () => {
  it('waits for both list data and brokers before rendering the workspace', async () => {
    const submissions = deferred<ServerApiResult<PaginatedResponse<SubmissionListItem>>>();
    const brokerOptions = deferred<ServerApiResult<Broker[]>>();
    vi.mocked(getSubmissions).mockReturnValue(submissions.promise);
    vi.mocked(getBrokers).mockReturnValue(brokerOptions.promise);
    let rendered = false;
    const page = SubmissionsPage({
      searchParams: Promise.resolve({ status: 'new', companySearch: 'Acme', page: '2' }),
    }).then((result) => {
      rendered = true;
      return result;
    });

    await vi.waitFor(() => expect(getBrokers).toHaveBeenCalledOnce());
    expect(getSubmissions).toHaveBeenCalledWith({ status: 'new', companySearch: 'Acme', page: 2 });
    const list = {
      ok: true as const,
      data: { count: 1, next: null, previous: null, results: [listItem()] },
    };
    submissions.resolve(list);
    await Promise.resolve();
    expect(rendered).toBe(false);
    brokerOptions.resolve({ ok: true, data: brokers });

    const result = await page;
    expect(result.props.submissions).toEqual(list);
    expect(result.props.brokers).toEqual({ ok: true, data: brokers });
  });

  it.each(['1', '12', '123'])(
    'fetches detail for valid numeric ID %s on the server',
    async (id) => {
      const detail = { ok: true as const, data: detailItem(Number(id)) };
      vi.mocked(getSubmissionDetail).mockResolvedValue(detail);

      const page = await SubmissionDetailPage({
        params: Promise.resolve({ id }),
        searchParams: Promise.resolve({ returnTo: ['/submissions?page=2', '/submissions'] }),
      });

      expect(getSubmissionDetail).toHaveBeenCalledWith(id);
      expect(page.props.result).toEqual(detail);
      expect(page.props.returnTo).toBe('/submissions?page=2');
    },
  );

  it.each(['bad', '0', '-1', '1d', '9007199254740992'])(
    'rejects invalid ID %s before fetching',
    async (id) => {
      const page = await SubmissionDetailPage({
        params: Promise.resolve({ id }),
        searchParams: Promise.resolve({}),
      });

      expect(getSubmissionDetail).not.toHaveBeenCalled();
      expect(page.props.result).toBeNull();
    },
  );

  it.each([404, 500])(
    'renders the resolved API failure %s instead of a loading state',
    async (status) => {
      const failure = { ok: false as const, status };
      vi.mocked(getSubmissionDetail).mockResolvedValue(failure);

      const page = await SubmissionDetailPage({
        params: Promise.resolve({ id: '1' }),
        searchParams: Promise.resolve({}),
      });

      expect(page.props.result).toEqual(failure);
    },
  );
});
