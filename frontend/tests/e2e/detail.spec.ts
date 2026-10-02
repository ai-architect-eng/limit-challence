import { expect, test } from '@playwright/test';
import { detailItem } from '../fixtures';
import { mockDetailApi } from './mock-api';

test.beforeEach(async ({ page }) => {
  await mockDetailApi(page, '1', { body: detailItem() });
});

test('renders submission detail and retains a filtered list return link', async ({ page }) => {
  await page.goto('/submissions/1?returnTo=%2Fsubmissions%3Fstatus%3Dnew%26page%3D2');

  await expect(page.getByRole('heading', { name: 'Acme 1', exact: true })).toBeVisible();
  for (const name of ['Summary', 'Contacts', 'Documents', 'Notes']) {
    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  }
  await expect(page.getByText('Jamie Contact', { exact: true })).toBeVisible();
  await expect(page.getByText('Review terms', { exact: true })).toBeVisible();
  const document = page.getByRole('link', { name: 'Contract', exact: true });
  await expect(document).toHaveAttribute('href', 'https://example.com/contract');
  await expect(document).toHaveAttribute('target', '_blank');
  await expect(document).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(page.getByRole('link', { name: 'Back to list' })).toHaveAttribute(
    'href',
    '/submissions?status=new&page=2',
  );
});

test('shows empty related sections and leaves unsafe document URLs as text', async ({ page }) => {
  const record = detailItem();
  record.contacts = [];
  record.notes = [];
  record.documents[0].fileUrl = 'javascript:alert(1)';
  await mockDetailApi(page, '1', { body: record });

  await page.goto('/submissions/1');

  await expect(page.getByText('No contacts provided.')).toBeVisible();
  await expect(page.getByText('No notes yet.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Contract', exact: true })).toHaveCount(0);
  await expect(page.getByText('Contract · Link unavailable', { exact: true })).toBeVisible();
});

test('server-renders not found and rejects invalid IDs without fetching them', async ({ page }) => {
  await mockDetailApi(page, '999999', {
    status: 404,
    body: { detail: 'Not found' },
    delayMs: 350,
  });

  const response = await page.goto('/submissions/999999');
  expect(await response!.text()).not.toContain('Loading submission…');
  await expect(page.getByText('Loading submission…', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Submission not found.', { exact: true })).toBeVisible();
  const before = await (await page.request.get('http://127.0.0.1:8010/__test__/state')).json();
  expect(before.counters.details).toBe(1);

  await page.goto('/submissions/bad');
  await expect(page.getByText('Invalid submission ID.', { exact: true })).toBeVisible();
  const after = await (await page.request.get('http://127.0.0.1:8010/__test__/state')).json();
  expect(after.counters.details).toBe(before.counters.details);
});

test('retries a server failure and then renders recovered empty documents', async ({ page }) => {
  await mockDetailApi(page, '1', { status: 500, body: {} });

  await page.goto('/submissions/1');
  await expect(page.getByRole('button', { name: 'Retry submission' })).toBeVisible();
  const record = detailItem();
  record.documents = [];
  await mockDetailApi(page, '1', { body: record });
  await page.getByRole('button', { name: 'Retry submission' }).click();
  await expect(page.getByRole('heading', { name: 'Acme 1', exact: true })).toBeVisible();
  await expect(page.getByText('No documents provided.')).toBeVisible();
});

test('retains the list while the server prepares a slow detail navigation', async ({ page }) => {
  await mockDetailApi(page, '1', { body: detailItem(), delayMs: 1500 });
  await page.goto('/submissions');
  await page.getByRole('link', { name: 'Acme 1', exact: true }).click();
  await expect
    .poll(async () => {
      const state = await (await page.request.get('http://127.0.0.1:8010/__test__/state')).json();
      return state.counters.details;
    })
    .toBeGreaterThan(0);

  await expect(page.getByRole('heading', { name: 'Submissions', exact: true })).toBeVisible();
  await expect(page.getByText('Loading submission…', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Acme 1', exact: true })).toBeVisible();
});

for (const width of [375, 768, 1280]) {
  test(`wraps long detail text without page overflow at ${width}px`, async ({ page }) => {
    const record = detailItem();
    record.notes[0].body = 'LongContext'.repeat(100);
    await mockDetailApi(page, '1', { body: record });
    await page.setViewportSize({ width, height: 812 });
    await page.goto('/submissions/1');
    await expect(page.getByRole('heading', { name: 'Notes', exact: true })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  });
}

test.describe('blocking detail SSR', () => {
  test.use({ javaScriptEnabled: false });

  test('renders delayed detail data without JavaScript or a loading screen', async ({ page }) => {
    await mockDetailApi(page, '1', { body: detailItem(), delayMs: 350 });
    const response = await page.goto('/submissions/1');
    const html = await response!.text();
    expect(html).toContain('Jamie Contact');
    expect(html).not.toContain('Loading submission…');
    await expect(page.getByRole('heading', { name: 'Acme 1', exact: true })).toBeVisible();
    await expect(page.getByText('Jamie Contact', { exact: true })).toBeVisible();
    await expect(page.getByText('Loading submission…', { exact: true })).toHaveCount(0);
  });
});
