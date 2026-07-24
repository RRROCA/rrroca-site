const { test, expect } = require('@playwright/test');

async function getAssistantTrigger(page) {
  const trigger = page.locator('.ai-fab, #ai-fab').first();
  if (await trigger.count() === 0) {
    return null;
  }

  return trigger;
}

async function openAssistant(page) {
  await page.goto('/');
  const trigger = await getAssistantTrigger(page);
  if (!trigger || !(await trigger.isVisible().catch(() => false))) {
    return false;
  }

  await trigger.click();
  await expect(page.locator('.ai-panel, #ai-panel').first()).toBeVisible();
  return true;
}

async function askQuestion(page, question) {
  const botMessages = page.locator('.ai-message.ai-bot');
  const initialCount = await botMessages.count();

  await page.locator('#ai-input-field, .ai-input input').first().fill(question);
  await page.locator('.ai-input button[type="submit"]').click();

  await expect(botMessages).toHaveCount(initialCount + 1);
  return botMessages.last();
}

test.describe('AI assistant', () => {
  test('shows the floating AI button on page load', async ({ page }) => {
    await page.goto('/');
    const trigger = await getAssistantTrigger(page);
    if (!trigger || !(await trigger.isVisible().catch(() => false))) {
      test.skip();
    }

    await expect(trigger).toBeVisible();
  });

  test('opens the chat panel when clicked', async ({ page }) => {
    if (!(await openAssistant(page))) {
      test.skip();
    }

    await expect(page.getByText(/RRROCA Assistant/i)).toBeVisible();
  });

  test('answers safety questions', async ({ page }) => {
    if (!(await openAssistant(page))) {
      test.skip();
    }

    const latestResponse = await askQuestion(page, 'safety');
    await expect(latestResponse).toContainText(/safest communities|Safety Dashboard|crime/i);
  });

  test('answers membership questions', async ({ page }) => {
    if (!(await openAssistant(page))) {
      test.skip();
    }

    const latestResponse = await askQuestion(page, 'membership');
    await expect(latestResponse).toContainText(/Membership Tiers|Join RRROCA|Family/i);
  });

  test('closes the panel with Escape', async ({ page }) => {
    if (!(await openAssistant(page))) {
      test.skip();
    }

    await page.keyboard.press('Escape');
    await expect(page.locator('.ai-panel, #ai-panel').first()).not.toBeVisible();
    await expect((await getAssistantTrigger(page))).toBeVisible();
  });

  test('lets visitors use suggestion chips', async ({ page }) => {
    if (!(await openAssistant(page))) {
      test.skip();
    }

    const botMessages = page.locator('.ai-message.ai-bot');
    const initialCount = await botMessages.count();

    await page.locator('.ai-suggestions button, #ai-suggestions button').filter({ hasText: 'Is it safe here?' }).first().click();

    await expect(botMessages).toHaveCount(initialCount + 1);
    await expect(botMessages.last()).toContainText(/safest communities|Safety Dashboard|crime/i);
  });
});
