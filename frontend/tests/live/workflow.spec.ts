import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import type { PaginatedResponse, SubmissionDetail, SubmissionListItem } from '../../lib/types';

const api = 'http://127.0.0.1:8001/api';

function capturePageErrors(page: Page, allowExpectedNotFound = false) {
  const errors: string[] = [];
  const notFoundConsoleMessage =
    'Failed to load resource: the server responded with a status of 404 (Not Found)';
  page.on('console', (message) => {
    if (
      message.type() === 'error' &&
      !(allowExpectedNotFound && message.text() === notFoundConsoleMessage)
    ) {
      errors.push(message.text());
    }
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

test('real seeded API supports browse filter paginate detail and restored return state', async ({
  page,
  request,
}) => {
  const pageErrors = capturePageErrors(page);
  const response = await request.get(`${api}/submissions/`);
  expect(response.status()).toBe(200);
  const initial = (await response.json()) as PaginatedResponse<SubmissionListItem>;
  expect(initial.count).toBe(25);
  expect(initial.results).toHaveLength(10);
  const first = initial.results[0];

  await page.goto('/submissions');
  await expect(page.getByText('25 submissions', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Next page' }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.getByText('Page 2 of 3', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Next page' }).click();
  await expect(page.getByText('Page 3 of 3', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next page' })).toBeDisabled();

  await page.getByRole('button', { name: 'Reset filters' }).click();
  await expect(page).toHaveURL('/submissions');
  await expect(page.getByLabel('Broker', { exact: true })).toBeEnabled();
  const statusLabels = { new: 'New', in_review: 'In review', closed: 'Closed', lost: 'Lost' };
  const statusSelect = page.getByRole('combobox', { name: 'Status' });
  await statusSelect.click();
  await page.getByRole('option', { name: statusLabels[first.status], exact: true }).click();
  await expect(statusSelect).toHaveText(statusLabels[first.status]);
  const brokerSelect = page.getByRole('combobox', { name: 'Broker' });
  await brokerSelect.click();
  await page.getByRole('option', { name: first.broker.name, exact: true }).click();
  await expect(brokerSelect).toHaveText(first.broker.name);
  await page.getByLabel('Company search', { exact: true }).fill(first.company.legalName);
  await page.getByRole('button', { name: 'Apply filters' }).click();
  await expect(page).toHaveURL(/companySearch=/);
  const filteredResponse = await request.get(`${api}/submissions/${new URL(page.url()).search}`);
  expect(filteredResponse.status()).toBe(200);
  const filtered = (await filteredResponse.json()) as PaginatedResponse<SubmissionListItem>;
  expect(filtered.results.length).toBeGreaterThan(0);
  await expect(page.getByRole('list', { name: 'Submissions' }).getByRole('listitem')).toHaveCount(
    filtered.results.length,
  );
  for (const record of filtered.results) {
    expect(record.status).toBe(first.status);
    expect(record.broker.id).toBe(first.broker.id);
    expect(record.company.legalName.toLowerCase()).toContain(first.company.legalName.toLowerCase());
  }
  const listUrl = page.url();
  await page.reload();
  await expect(page.getByLabel('Company search', { exact: true })).toHaveValue(
    first.company.legalName,
  );
  await expect(page.getByRole('combobox', { name: 'Status' })).toHaveText(
    statusLabels[first.status],
  );
  await expect(page.getByRole('combobox', { name: 'Broker' })).toHaveText(first.broker.name);

  const detailResponse = await request.get(`${api}/submissions/${first.id}/`);
  expect(detailResponse.status()).toBe(200);
  const detail = (await detailResponse.json()) as SubmissionDetail;
  await page.locator(`a[href^="/submissions/${first.id}?"]`).click();
  await expect(
    page.getByRole('heading', { name: detail.company.legalName, exact: true }),
  ).toBeVisible();
  await expect(page.getByText(detail.summary, { exact: true })).toBeVisible();
  for (const contact of detail.contacts)
    await expect(page.getByText(contact.name, { exact: true })).toBeVisible();
  for (const note of detail.notes)
    await expect(page.getByText(note.body, { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Back to list' }).click();
  await expect(page).toHaveURL(listUrl);
  await expect(page.getByRole('combobox', { name: 'Broker' })).toHaveText(first.broker.name);
  await expect(page.getByRole('combobox', { name: 'Status' })).toHaveText(
    statusLabels[first.status],
  );
  expect(pageErrors).toEqual([]);
});

test('home opens the review workspace', async ({ page }) => {
  const pageErrors = capturePageErrors(page);
  await page.goto('/');
  await expect(page).toHaveURL('/submissions');
  await expect(page.getByRole('heading', { name: 'Submissions', exact: true })).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test('real not-found response and mobile layout', async ({ page, request }) => {
  const pageErrors = capturePageErrors(page, true);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/submissions');
  await expect(page.getByText('25 submissions', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  const response = await page.goto('/submissions/999999');
  const html = await response!.text();
  expect(html).toContain('Submission not found.');
  expect(html).not.toContain('Loading submission…');
  expect((await request.get(`${api}/submissions/999999/`)).status()).toBe(404);
  await expect(page.getByText('Submission not found.', { exact: true })).toBeVisible();
  expect(pageErrors).toEqual([]);
});
