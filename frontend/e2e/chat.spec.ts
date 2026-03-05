import { test, expect } from '@playwright/test';

test.describe('Gemini Jailbreak E2E Flows', () => {
    test('Happy Path: Send message and see AI response stream', async ({ page }) => {
        // Intercept backend API call to return a mock response and not eat real credits during CI
        await page.route('**/api/send', async route => {
            const json = {
                text: 'Mocked AI Response'
            };
            await route.fulfill({ json, status: 200, contentType: 'application/json' });
        });

        await page.route('**/api/history**', async route => {
            await route.fulfill({ json: { history: [] }, status: 200 });
        });

        await page.route('**/api/models', async route => {
            await route.fulfill({ json: { models: ['gemini-3.1-pro'] }, status: 200 });
        });

        await page.goto('http://localhost:5173');

        // Expected initial empty state with illustration
        await expect(page.locator('text=Start a conversation')).toBeVisible();

        // Type API key
        await page.fill('input[type="password"]', 'AIzaTestKey123');

        // Type prompt
        await page.fill('textarea[placeholder*="Inject command"]', 'Hello, Playwright!');

        // Send
        await page.click('[data-testid="send-button"]');

        // Verify loading state skeleton or busy indicator
        await expect(page.locator('text=Generating')).toBeVisible();

        // Wait for the mock API response
        await expect(page.locator('text=Mocked AI Response')).toBeVisible({ timeout: 10000 });
    });

    test('Error Path: Empty API key shows toast validation', async ({ page }) => {
        await page.goto('http://localhost:5173');

        await page.fill('textarea[placeholder*="Inject command"]', 'Hello without key');
        await page.click('[data-testid="send-button"]');

        // Should not send, should show Sonner toast error
        await expect(page.locator('text=API Key Required')).toBeVisible();
    });
});
