import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('adds a fact, recalls it, explains timing, and persists', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Retrieval Rhythm');
  await expect(page.getByRole('heading', { name: /Remember the fact/i })).toBeVisible();

  await page.getByRole('button', { name: 'Add your first facts' }).click();
  await page.getByLabel('Prompt', { exact: true }).fill('Capital of Senegal');
  await page.getByLabel('Accepted answer').fill('Dakar');
  await page.getByRole('button', { name: 'Add fact' }).click();
  await expect(page.getByText('Capital of Senegal', { exact: true })).toBeVisible();

  await page.getByRole('link', { name: /Review/ }).click();
  await expect(page.getByRole('heading', { name: 'Capital of Senegal' })).toBeVisible();
  await page.getByLabel('Your answer').fill('dakar');
  await page.getByRole('button', { name: 'Check answer' }).click();
  await expect(page.getByText('Due because…')).toBeVisible();
  await expect(page.getByText(/interval grows to 1 day/)).toBeVisible();
  await page.getByRole('button', { name: 'Finish for now' }).click();
  await expect(page.getByRole('heading', { name: 'You’re caught up.' })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { name: 'You’re caught up.' })).toBeVisible();
});

test('has no serious accessibility violations on empty state', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('main')).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
});

test('loads and retains the local interface offline', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await page.waitForFunction(async () => {
    const keys = await caches.keys();
    const cache = await caches.open(keys.find((key) => key.startsWith('rhythm-')) ?? 'missing');
    const script = Array.from(document.scripts).find((item) => item.src.includes('/assets/'))?.src;
    return Boolean(script && await cache.match(script));
  });
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Retrieval Rhythm');
  await expect(page.getByText('Offline · changes stay local')).toBeVisible();
});
