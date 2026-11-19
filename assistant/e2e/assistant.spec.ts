import { test, expect, type Page } from '@playwright/test';

const STREAM = { timeout: 10_000 };

const noHorizontalScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

async function askTurbo(page: Page) {
  await page.getByRole('button', { name: 'Ask about Turbo Mode' }).click();
  await expect(page.getByText('Want the numbers, or how he got there?')).toBeVisible(STREAM);
}

test.describe('desktop', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('welcome screen', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Ask me about Vishal’s work.' })).toBeVisible();
    for (const name of ['Turbo Mode', 'Trade Ideas', 'Fisdom Revamp']) {
      await expect(page.getByRole('button', { name: `Ask about ${name}` })).toBeVisible();
    }
    await expect(page.getByRole('button', { name: /^Ask about / })).toHaveCount(3);
    await expect(page.getByText('I’m an AI. I can’t make commitments on Vishal’s behalf.')).toBeVisible();
    await expect(page.getByRole('log', { name: 'Conversation' })).toContainText('AI assistant');
  });

  test('Turbo Mode flow', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Ask about Turbo Mode' }).click();
    const log = page.getByRole('log', { name: 'Conversation' });
    await expect(log.getByText('Tell me about Turbo Mode', { exact: true })).toBeVisible(STREAM);
    await expect(page.getByText('Pulling up the Turbo Mode case study')).toBeVisible(STREAM);
    await expect(page.getByRole('tab', { name: 'Results' })).toHaveAttribute('aria-selected', 'true', STREAM);
    await expect(page.getByRole('heading', { name: /From 10\+ taps to/ })).toBeVisible(STREAM);
    await expect(page.getByText('Want the numbers, or how he got there?')).toBeVisible(STREAM);
    for (const chip of ['The numbers', 'How he got there', 'Other work']) {
      await expect(page.getByRole('button', { name: chip, exact: true })).toBeVisible(STREAM);
    }
    await expect(page.getByRole('link', { name: 'Open full case study' })).toHaveAttribute('target', '_blank');
  });

  test('keyboard: Enter sends a question', async ({ page }) => {
    await page.goto('/');
    const box = page.getByRole('textbox', { name: 'Message Vishal’s assistant' });
    await box.focus();
    await page.keyboard.type('What is his salary?');
    await page.keyboard.press('Enter');
    const reply = page.getByRole('log', { name: 'Conversation' }).getByText(/That’s one for Vishal himself/);
    await expect(reply).toBeVisible(STREAM);
    const text = (await reply.innerText()) ?? '';
    expect(text).not.toMatch(/\d/);
  });

  test('keyboard: Shift+Enter inserts a newline and does not send', async ({ page }) => {
    await page.goto('/');
    const box = page.getByRole('textbox', { name: 'Message Vishal’s assistant' });
    await box.focus();
    await page.keyboard.type('line one');
    await page.keyboard.press('Shift+Enter');
    await page.keyboard.type('line two');
    await expect(box).toHaveValue(/\n/);
    await expect(page.getByRole('log', { name: 'Conversation' }).getByText('line one')).toHaveCount(0);
  });

  test('keyboard: arrow keys move between tabs', async ({ page }) => {
    await page.goto('/');
    await askTurbo(page);
    const results = page.getByRole('tab', { name: 'Results' });
    await results.focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Learnings' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText('Details coming soon.')).toBeVisible();
  });

  test('embed mode', async ({ page }) => {
    const res = await page.goto('/?embed=1');
    await expect(page.getByRole('button', { name: 'Talk to my assistant' })).toHaveCount(0);
    await expect(page.getByRole('log', { name: 'Conversation' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Ask me about Vishal’s work.' })).toBeVisible();
    const csp = (await res!.allHeaders())['content-security-policy'];
    expect(csp).toContain('frame-ancestors');
    expect(csp).toContain('framer');
  });

  for (const size of [
    { width: 1024, height: 768 },
    { width: 1440, height: 900 },
  ]) {
    test(`no horizontal scroll at ${size.width}x${size.height}`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.goto('/');
      await expect(page.getByRole('heading', { name: 'Ask me about Vishal’s work.' })).toBeVisible();
      expect(await noHorizontalScroll(page)).toBe(true);
    });
  }
});

test.describe('mobile', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('welcome screen', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('ordered in Turbo Mode')).toBeVisible();
    await expect(page.getByText('Fisdom conversion')).toBeVisible();
    await expect(page.getByText('I’m an AI. I can’t make commitments for Vishal.')).toBeVisible();
    expect(await noHorizontalScroll(page)).toBe(true);
  });

  test('case study sheet opens, closes and reopens', async ({ page }) => {
    await page.goto('/');
    const box = page.getByRole('textbox', { name: 'Message Vishal’s assistant' });
    await box.fill('Tell me about Turbo Mode');
    await box.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Turbo Mode case study' });
    await expect(dialog).toBeVisible(STREAM);
    await expect(dialog.getByRole('tab', { name: 'Results' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText('Want the numbers, or how he got there?')).toBeVisible(STREAM);

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(box).toBeFocused();

    await page.getByRole('button', { name: /^Open:/ }).last().click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Back to chat' }).click();
    await expect(dialog).toBeHidden();
  });

  test('unknown project is not echoed or invented', async ({ page }) => {
    await page.goto('/');
    const box = page.getByRole('textbox', { name: 'Message Vishal’s assistant' });
    await box.fill('Tell me about AlphaGrep');
    await box.press('Enter');
    const log = page.getByRole('log', { name: 'Conversation' });
    await expect(log.getByText(/I won’t guess/)).toBeVisible(STREAM);
    const text = await log.innerText();
    expect(text.split('AlphaGrep').length - 1).toBe(1);
  });
});
