const { test, expect } = require('@playwright/test');

async function openAssistant(page) {
  await page.goto('/');
  await page.locator('#ai-fab').click();
  await expect(page.locator('#ai-panel')).toBeVisible();
}

async function askQuestion(page, question) {
  const botMessages = page.locator('.ai-message.ai-bot');
  const initialCount = await botMessages.count();

  await page.locator('#ai-input-field').fill(question);
  await page.locator('.ai-input button[type="submit"]').click();

  await expect(botMessages).toHaveCount(initialCount + 1);
  return botMessages.last();
}

test.describe('AI assistant', () => {
  test('shows the floating AI button on page load', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#ai-fab')).toBeVisible();
  });

  test('opens the chat panel when clicked', async ({ page }) => {
    await openAssistant(page);
    await expect(page.getByText(/RRROCA Assistant/i)).toBeVisible();
  });

  test('answers safety questions', async ({ page }) => {
    await openAssistant(page);
    const latestResponse = await askQuestion(page, 'safety');
    await expect(latestResponse).toContainText(/safest communities|Safety Dashboard|crime/i);
  });

  test('answers membership questions', async ({ page }) => {
    await openAssistant(page);
    const latestResponse = await askQuestion(page, 'membership');
    await expect(latestResponse).toContainText(/Membership Tiers|Join RRROCA|Family/i);
  });

  test('closes the panel with Escape', async ({ page }) => {
    await openAssistant(page);
    await page.keyboard.press('Escape');
    await expect(page.locator('#ai-panel')).not.toBeVisible();
    await expect(page.locator('#ai-fab')).toBeVisible();
  });

  test('lets visitors use suggestion chips', async ({ page }) => {
    await openAssistant(page);
    const botMessages = page.locator('.ai-message.ai-bot');
    const initialCount = await botMessages.count();

    await page.locator('#ai-suggestions button').filter({ hasText: 'Is it safe here?' }).click();

    await expect(botMessages).toHaveCount(initialCount + 1);
    await expect(botMessages.last()).toContainText(/safest communities|Safety Dashboard|crime/i);
  });
});
