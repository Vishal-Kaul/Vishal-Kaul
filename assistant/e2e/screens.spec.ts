import { test, expect } from '@playwright/test';

// Full-page screenshots for human review. These are not visual assertions.
const dir = 'e2e/__screens__';
const STREAM = { timeout: 10_000 };

test.describe('desktop screens', () => {
  test.use({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });

  test('desktop-welcome', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Ask me about Vishal’s work.' })).toBeVisible();
    await page.screenshot({ path: `${dir}/desktop-welcome.png`, fullPage: true });
  });

  test('desktop-case', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Ask about Turbo Mode' }).click();
    await expect(page.getByText('Want the numbers, or how he got there?')).toBeVisible(STREAM);
    await page.screenshot({ path: `${dir}/desktop-case.png`, fullPage: true });
  });
});

test.describe('mobile screens', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });

  test('mobile-welcome', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('ordered in Turbo Mode')).toBeVisible();
    await page.screenshot({ path: `${dir}/mobile-welcome.png`, fullPage: true });
  });

  test('mobile-sheet', async ({ page }) => {
    await page.goto('/');
    const box = page.getByRole('textbox', { name: 'Message Vishal’s assistant' });
    await box.fill('Tell me about Turbo Mode');
    await box.press('Enter');
    await expect(page.getByRole('dialog', { name: 'Turbo Mode case study' })).toBeVisible(STREAM);
    await expect(page.getByText('Want the numbers, or how he got there?')).toBeVisible(STREAM);
    await page.waitForTimeout(500); // let the sheet slide finish
    await page.screenshot({ path: `${dir}/mobile-sheet.png`, fullPage: true });
  });
});
