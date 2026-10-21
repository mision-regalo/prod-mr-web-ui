import { test, expect } from '@playwright/test';

test('edit donor sponsor and save', async ({ page }) => {
  // Navigate to the app (using the dev server URL for the test environment)
  await page.goto('http://localhost:3000'); 

  // Navigate to Volunteers view
  // Wait for the drawer and the specific button to be present
  await page.waitForSelector('[data-testid="nav-volunteers"]', { timeout: 15000 });
  await page.click('[data-testid="nav-volunteers"]'); 

  // Click the edit button for the first donor
  // Correct aria-label matches the code
  await page.waitForSelector('button[aria-label="Edit donor"]', { timeout: 15000 });
  await page.click('button[aria-label="Edit donor"] >> nth=0');

  // Verify modal is open
  await page.waitForSelector('text=Editar Padrino Donante', { timeout: 10000 });
  await expect(page.locator('text=Editar Padrino Donante')).toBeVisible();

  // Save changes
  await page.click('text=Guardar Cambios');

  // Verify modal is closed
  await expect(page.locator('text=Editar Padrino Donante')).not.toBeVisible();
});
