import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('adds a fact, recalls it, explains timing, and persists', async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') runtimeErrors.push(message.text()); });
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
  expect(runtimeErrors).toEqual([]);
});

test('has no serious accessibility violations on empty state', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('main')).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
});

test('supports the skip link and numbered keyboard navigation', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to practice' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  await page.keyboard.press('2');
  await expect(page.getByRole('heading', { name: 'Library' })).toBeVisible();
});

test('keeps every visible Library target at least 44 by 44 CSS pixels at 390 px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Add your first facts' }).click();
  await page.getByLabel('Prompt', { exact: true }).fill('Touch target probe');
  await page.getByLabel('Accepted answer').fill('Forty-four pixels');
  await page.getByRole('button', { name: 'Add fact' }).click();

  const targets = [
    ['home wordmark', page.getByRole('link', { name: 'Retrieval Rhythm home' })],
    ['Export JSON', page.getByRole('button', { name: 'Export JSON' })],
    ['Export CSV', page.getByRole('button', { name: 'Export CSV' })],
    ['Import JSON', page.locator('label.file-button')],
    ['Edit fact', page.getByRole('button', { name: 'Edit Touch target probe' })],
    ['Delete fact', page.getByRole('button', { name: 'Delete Touch target probe' })]
  ] as const;
  const undersized: string[] = [];

  for (const [name, target] of targets) {
    await expect(target).toBeVisible();
    const box = await target.boundingBox();
    expect(box, `${name} must have a layout box`).not.toBeNull();
    if (box && (box.width < 44 || box.height < 44)) {
      undersized.push(`${name}: ${box.width.toFixed(1)}x${box.height.toFixed(1)}`);
    }
  }

  expect(undersized, 'Visible touch targets smaller than 44x44 CSS pixels').toEqual([]);
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

test('rejects an orphan import without replacing facts, and can restore a valid replacement', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Add your first facts' }).click();
  await page.getByLabel('Prompt', { exact: true }).fill('Local fact');
  await page.getByLabel('Accepted answer').fill('Keep me');
  await page.getByRole('button', { name: 'Add fact' }).click();

  let replacementPrompted = false;
  const rejectUnexpectedReplacement = (dialog: { dismiss(): Promise<void> }) => { replacementPrompted = true; void dialog.dismiss(); };
  page.on('dialog', rejectUnexpectedReplacement);
  await page.locator('#import-file').setInputFiles('tests/fixtures/orphan-import.json');
  await expect(page.getByText('A fact refers to a collection that is not in this backup.')).toBeVisible();
  await expect(page.getByText('Local fact', { exact: true })).toBeVisible();
  expect(replacementPrompted).toBe(false);
  page.off('dialog', rejectUnexpectedReplacement);

  page.once('dialog', (dialog) => void dialog.accept());
  await page.locator('#import-file').setInputFiles('tests/fixtures/valid-import.json');
  await expect(page.getByText('Imported fact', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Restore data from before your last import' })).toBeVisible();

  page.once('dialog', (dialog) => void dialog.accept());
  await page.getByRole('button', { name: 'Restore data from before your last import' }).click();
  await expect(page.getByText('Local fact', { exact: true })).toBeVisible();
  await expect(page.getByText('Imported fact', { exact: true })).not.toBeVisible();
});
