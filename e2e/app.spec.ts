import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});
test('live draft, adding, deleting, and undo', async ({ page }) => {
  await page.getByLabel('New task', { exact: true }).fill('Ship portfolio');
  await expect(page.locator('.task-ghost')).toHaveText('Ship portfolio');
  await expect(
    page.getByRole('button', { name: 'Open task: Ship portfolio', exact: true }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.locator('.task-ghost')).toHaveCount(0);
  await page.getByRole('button', { name: 'Delete task: Ship portfolio', exact: true }).click();
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Open task: Ship portfolio', exact: true }),
  ).toBeVisible();
});
test('lists, drafts and renamed titles remain independent', async ({ page }) => {
  await page.getByLabel('New task', { exact: true }).fill('Home draft');
  await page.getByRole('button', { name: 'New list', exact: true }).click();
  await page.getByLabel('List name', { exact: true }).fill('Work');
  await page.getByRole('button', { name: 'Create', exact: true }).click();
  await expect(page.getByLabel('New task', { exact: true })).toHaveValue('');
  await page.getByLabel('Current list name').fill('Portfolio');
  await page.getByLabel('Current list name').press('Enter');
  await expect(page.getByRole('button', { name: 'Portfolio', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'My tasks', exact: true }).click();
  await expect(page.getByLabel('New task', { exact: true })).toHaveValue('Home draft');
  await page.getByRole('button', { name: 'Portfolio', exact: true }).click();
  await page.reload();
  await expect(page.getByLabel('Current list name')).toHaveValue('Portfolio');
});
test('task dialog saves rich descriptions and cancels drafts', async ({ page }) => {
  await page.getByLabel('New task', { exact: true }).fill('Write README');
  await page.getByLabel('New task', { exact: true }).press('Enter');
  await page.getByRole('button', { name: 'Open task: Write README', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Description', exact: true })
    .fill('Explain architectural decisions');
  await page.getByRole('button', { name: 'Block type', exact: true }).click();
  await expect(page.getByRole('menuitem', { name: 'Heading 1 Large heading' })).toBeVisible();
  await page.getByRole('menuitem', { name: 'Text Plain paragraph' }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.locator('.task-preview')).toHaveText('Explain architectural decisions');
  await page.getByRole('button', { name: 'Open task: Write README', exact: true }).click();
  await page.getByLabel('Task name', { exact: true }).fill('Discarded');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Open task: Write README', exact: true }),
  ).toBeVisible();
});
test('completion hides tasks until the completed toggle is enabled', async ({ page }) => {
  await page.getByLabel('New task', { exact: true }).fill('Done');
  await page.getByLabel('New task', { exact: true }).press('Enter');
  await page.getByRole('button', { name: 'Complete task: Done', exact: true }).click();
  await expect(page.locator('.task-open')).toHaveCount(0);
  await page.getByLabel('Completed', { exact: true }).check();
  await page.getByRole('button', { name: 'Reopen task: Done', exact: true }).click();
  await page.getByLabel('Completed', { exact: true }).uncheck();
  await expect(page.locator('.task-open')).toHaveCount(1);
});
test('delete all requires confirmation and is undoable', async ({ page }) => {
  for (const name of ['First', 'Second']) {
    await page.getByLabel('New task', { exact: true }).fill(name);
    await page.getByLabel('New task', { exact: true }).press('Enter');
  }
  await page.getByRole('button', { name: 'Delete all', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.locator('.task-open')).toHaveCount(2);
  await page.getByRole('button', { name: 'Delete all', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete all', exact: true }).click();
  await expect(page.locator('.task-open')).toHaveCount(0);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.locator('.task-open')).toHaveCount(2);
});
test('matrix priorities update original tasks and persist', async ({ page }) => {
  await page.getByLabel('New task', { exact: true }).fill('Prepare interview');
  await page.getByLabel('New task', { exact: true }).press('Enter');
  await page.getByRole('button', { name: 'Important: Prepare interview', exact: true }).click();
  await page.getByRole('button', { name: 'Matrix', exact: true }).click();
  await expect(
    page
      .getByRole('region', { name: 'Important, not urgent', exact: true })
      .getByRole('button', { name: 'Open task: Prepare interview', exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Important: Prepare interview', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
});
test('palette popup closes with Escape without closing task details', async ({ page }) => {
  await page.getByLabel('New task', { exact: true }).fill('Palette');
  await page.getByLabel('New task', { exact: true }).press('Enter');
  await page.getByRole('button', { name: 'Open task: Palette', exact: true }).click();
  await page.getByRole('button', { name: 'Add new color', exact: true }).click();
  await page.getByLabel('Color HEX', { exact: true }).fill('#123456');
  await page.getByLabel('Color HEX', { exact: true }).press('Escape');
  await expect(page.getByLabel('Task name', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
});
test('interface is English and fits the viewport', async ({ page }) => {
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  expect(await page.locator('main').innerText()).not.toMatch(/[\u0400-\u04ff]/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
