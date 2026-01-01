// Point de départ des tests de bout en bout : la coquille se charge et est navigable au clavier.
// PLAY-002 : on pilote par des rôles visibles, jamais par un état interne.
import { expect, test } from '@playwright/test';

test('application_isServed_showsItsMainLandmarkAndNavigation', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('navigation')).toBeVisible();
  await expect(page.getByRole('main')).toBeVisible();
});

test('application_keyboardOnly_reachesTheFirstLink', async ({ page }) => {
  await page.goto('/');

  await page.keyboard.press('Tab');

  await expect(page.getByRole('link').first()).toBeFocused();
});
