import { test, expect } from '@playwright/test';

test('home page has the assistant title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle("Vishal's Assistant");
});
