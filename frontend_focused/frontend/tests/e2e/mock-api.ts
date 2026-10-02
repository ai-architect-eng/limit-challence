import type { Page } from '@playwright/test';
import { brokers, listItem } from '../fixtures';
import type { Broker, SubmissionDetail, SubmissionListItem } from '@/lib/types';

type MockResponse = { status?: number; body: unknown; delayMs?: number };
type MockApiState = {
  brokers?: Broker[];
  brokersResponse?: MockResponse;
  submissions?: SubmissionListItem[];
  submissionsResponse?: MockResponse;
  detailResponses?: Record<string, MockResponse | { status?: number; body: SubmissionDetail; delayMs?: number }>;
};

const apiStateUrl = 'http://127.0.0.1:8010/__test__/state';

export async function setMockApi(page: Page, overrides: MockApiState = {}) {
  const response = await page.request.post(apiStateUrl, {
    data: {
      brokers,
      submissions: [],
      ...overrides,
    },
  });
  if (!response.ok()) throw new Error(`Mock API state update failed: ${response.status()}`);
}

export async function mockListApi(page: Page, overrides: MockApiState = {}) {
  await setMockApi(page, {
    brokers,
    submissions: Array.from({ length: 11 }, (_, index) => listItem(index + 1)),
    ...overrides,
  });
}

export async function mockDetailApi(page: Page, id: string, response: MockResponse) {
  await mockListApi(page, { detailResponses: { [id]: response } });
}
