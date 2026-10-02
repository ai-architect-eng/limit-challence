import { expect, test } from '@playwright/test';
import { listItem } from '../fixtures';
import { mockListApi } from './mock-api';

test.beforeEach(async ({ page }) => {
  await mockListApi(page);
});

test('includes submission data in the initial server-rendered HTML', async ({ page }) => {
  const response = await page.request.get('http://127.0.0.1:3001/submissions');
  expect(response.ok()).toBe(true);
  const html = await response.text();
  expect(html).toContain('Acme 1');
  expect(html).not.toContain('Loading submissions…');
  expect(html).not.toContain('Loading brokers…');
});

test.describe('blocking list SSR', () => {
  test.use({ javaScriptEnabled: false });

  test('renders delayed list data and brokers without JavaScript or a loading screen', async ({
    page,
  }) => {
    await mockListApi(page, {
      submissionsResponse: {
        body: { count: 1, next: null, previous: null, results: [listItem()] },
        delayMs: 350,
      },
      brokersResponse: {
        body: [{ id: 1, name: 'Apollo', primaryContactEmail: null }],
        delayMs: 350,
      },
    });
    const response = await page.goto('/submissions?brokerId=1');
    const html = await response!.text();
    expect(html).toContain('Acme 1');
    expect(html).not.toContain('Loading submissions…');
    expect(html).not.toContain('Loading brokers…');
    await expect(page.getByRole('link', { name: 'Acme 1', exact: true })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Broker' })).toHaveText('Apollo');
    await expect(page.getByText('1 submission', { exact: true })).toBeVisible();
  });
});

test('retains existing results during a slow server-rendered pagination transition', async ({
  page,
}) => {
  await page.goto('/submissions');
  await expect(page.getByRole('link', { name: 'Acme 1', exact: true })).toBeVisible();
  await mockListApi(page, {
    submissionsResponse: {
      body: { count: 11, next: null, previous: '?page=1', results: [listItem(11)] },
      delayMs: 1500,
    },
  });
  await page.getByRole('button', { name: 'Next page' }).click();
  await expect
    .poll(async () => {
      const state = await (await page.request.get('http://127.0.0.1:8010/__test__/state')).json();
      return state.counters.submissions;
    })
    .toBeGreaterThan(0);

  await expect(page.getByRole('link', { name: 'Acme 1', exact: true })).toBeVisible();
  await expect(page.getByText('Loading submissions…', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Next page' })).toBeDisabled();
  await expect(page.getByRole('link', { name: 'Acme 11', exact: true })).toBeVisible();
});

test('renders submission context and paginates through browser history', async ({ page }) => {
  await page.goto('/submissions');
  const company = page.getByRole('link', { name: 'Acme 1', exact: true });
  await expect(company).toBeVisible();
  const card = page.getByRole('listitem').filter({ has: company });
  await expect(card).toContainText('New');
  await expect(card).toContainText('Insurance · London');
  await expect(card).toContainText('Review coverage');
  await expect(card).toContainText('Broker: Apollo · Owner: Alex Owner');
  await expect(card).toContainText('Priority: high');
  await expect(card).toContainText('Alex Owner: Review terms');
  await expect(page.getByText('11 submissions', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Previous page' })).toBeDisabled();
  await page.getByRole('button', { name: 'Next page' }).click();
  await expect(page).toHaveURL(/page=2$/);
  await expect(page.getByRole('link', { name: 'Acme 11', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next page' })).toBeDisabled();
  await page.goBack();
  await expect(company).toBeVisible();
  await page.goForward();
  await expect(page.getByRole('link', { name: 'Acme 11', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Previous page' }).click();
  await expect(page).toHaveURL('/submissions');
  await expect(company).toBeVisible();
});

test('combines filters, resets the page, and preserves values on reload and history', async ({
  page,
}) => {
  await page.goto('/submissions?page=2');
  await expect(page.getByRole('combobox', { name: 'Broker' })).toBeEnabled();
  const statusSelect = page.getByRole('combobox', { name: 'Status' });
  await statusSelect.click();
  await page.getByRole('option', { name: 'In review', exact: true }).click();
  await expect(statusSelect).toHaveText('In review');
  const brokerSelect = page.getByRole('combobox', { name: 'Broker' });
  await brokerSelect.click();
  await page.getByRole('option', { name: 'Zenith', exact: true }).click();
  await expect(brokerSelect).toHaveText('Zenith');
  await page.getByLabel('Company search', { exact: true }).fill('Acme 2');
  await page.getByRole('button', { name: 'Apply filters' }).click();
  await expect(page).toHaveURL('/submissions?status=in_review&brokerId=2&companySearch=Acme+2');
  await expect(page.getByRole('link', { name: 'Acme 2', exact: true })).toBeVisible();
  await expect(page.getByText('1 submission', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Company search', { exact: true })).toHaveValue('Acme 2');
  await expect(page.getByRole('combobox', { name: 'Status' })).toHaveText('In review');
  await expect(page.getByRole('combobox', { name: 'Broker' })).toHaveText('Zenith');
  await expect(page.getByRole('link', { name: 'Acme 2', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Reset filters' }).click();
  await expect(page).toHaveURL('/submissions');
  await page.goBack();
  await expect(page.getByLabel('Company search', { exact: true })).toHaveValue('Acme 2');
  await expect(page.getByRole('link', { name: 'Acme 2', exact: true })).toBeVisible();
});

test('links to detail with the applied list URL as the return destination', async ({ page }) => {
  await page.goto('/submissions?status=in_review&brokerId=2&companySearch=Acme+2');
  await expect(page.getByRole('link', { name: 'Acme 2', exact: true })).toHaveAttribute(
    'href',
    '/submissions/2?returnTo=%2Fsubmissions%3Fstatus%3Din_review%26brokerId%3D2%26companySearch%3DAcme%2B2',
  );
});

test('renders successful empty results and resets the filters', async ({ page }) => {
  await page.goto('/submissions?companySearch=missing');
  await expect(page.getByText('No submissions match these filters.')).toBeVisible();
  await expect(page.getByText('0 submissions', { exact: true })).toBeVisible();
  const filterPanel = page.getByRole('region', { name: 'Submission filters' });
  await expect(filterPanel.getByRole('button', { name: 'Reset filters' })).toBeVisible();
  await filterPanel.getByRole('button', { name: 'Reset filters' }).click();
  await expect(page).toHaveURL('/submissions');
  await expect(page.getByRole('link', { name: 'Acme 1', exact: true })).toBeVisible();
});

test('server-renders failure without a loading screen or zero results, then retries', async ({
  page,
}) => {
  await mockListApi(page, {
    submissionsResponse: { status: 500, body: { detail: 'Unavailable' }, delayMs: 350 },
  });
  await page.goto('/submissions');
  await expect(page.getByText('Loading submissions…', { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole('alert').filter({ hasText: 'Could not load submissions.' }),
  ).toBeVisible();
  await expect(page.getByText('0 submissions', { exact: true })).toHaveCount(0);
  await expect(page.getByText('No submissions match these filters.')).toHaveCount(0);
  await mockListApi(page);
  await page.getByRole('button', { name: 'Retry submissions' }).click();
  await expect(page.getByRole('link', { name: 'Acme 1', exact: true })).toBeVisible();
});

test('broker failure preserves the applied broker and allows independent retries', async ({
  page,
}) => {
  await mockListApi(page, { brokersResponse: { status: 500, body: {} } });
  await page.goto('/submissions?brokerId=2');
  await expect(page.getByRole('link', { name: 'Acme 2', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Retry brokers' })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Broker' })).toBeDisabled();
  await page.getByLabel('Company search', { exact: true }).fill('Acme 2');
  await page.getByRole('button', { name: 'Apply filters' }).click();
  await expect(page).toHaveURL('/submissions?brokerId=2&companySearch=Acme+2');
  await mockListApi(page);
  await page.getByRole('button', { name: 'Retry brokers' }).click();
  await expect(page.getByRole('combobox', { name: 'Broker' })).toBeEnabled();
  await expect(page.getByRole('combobox', { name: 'Broker' })).toHaveText('Zenith');
});

test('renders fallback context for records with missing optional content', async ({ page }) => {
  const item = listItem();
  await mockListApi(page, {
    submissions: [
      {
        ...item,
        summary: '',
        company: { ...item.company, industry: '', headquartersCity: '' },
        documentCount: 0,
        noteCount: 0,
        latestNote: null,
      },
    ],
  });
  await page.goto('/submissions');
  await expect(page.getByText('Industry not provided · Location not provided')).toBeVisible();
  await expect(page.getByText('No summary provided.')).toBeVisible();
  await expect(page.getByText('No notes yet.')).toBeVisible();
  await expect(page.getByText('0 documents · 0 notes')).toBeVisible();
});

for (const width of [375, 768, 1280]) {
  test(`long content fits without page overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 });
    const item = listItem();
    const companyName = 'LongCompanyName'.repeat(16);
    await mockListApi(page, {
      submissions: [{ ...item, company: { ...item.company, legalName: companyName } }],
    });
    await page.goto('/submissions');
    await expect(page.getByRole('link', { name: companyName, exact: true })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  });
}

test('filter controls can be reached and applied with the keyboard', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/submissions');
  await expect(page.getByLabel('Broker', { exact: true })).toBeEnabled();
  await page.getByLabel('Status', { exact: true }).focus();
  await expect(page.getByLabel('Status', { exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Broker', { exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Company search', { exact: true })).toBeFocused();
  await page.keyboard.type('Acme 2');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Apply filters' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/submissions?companySearch=Acme+2');
  await expect(page.getByRole('link', { name: 'Acme 2', exact: true })).toBeVisible();
});
