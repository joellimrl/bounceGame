import { test, expect } from '@playwright/test';
const saveKey = 'bounce.classic.v1';
async function saved(page: import('@playwright/test').Page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).run, saveKey);
}
test('starts, moves, pauses without drift, and resumes after reload', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'New game', exact: true }).click();
  await expect(page.locator('#level-label')).toHaveText('Level 1 / 11');
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(800);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Resume game', exact: true })).toBeVisible();
  const before = await saved(page);
  expect(before.ball.x).toBeGreaterThan(30);
  expect(before.mode).toBe('paused');
  await page.waitForTimeout(250);
  expect((await saved(page)).tick).toBe(before.tick);
  await page.reload();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.keyboard.press('Escape');
  const after = await saved(page);
  expect(after.ball.x).toBeGreaterThanOrEqual(before.ball.x);
  expect(after.score).toBe(before.score);
  expect(errors).toEqual([]);
});
test('instructions do not resume gameplay when dismissed with Escape', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'New game', exact: true }).click();
  await page.getByRole('button', { name: 'How to play', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Resume game', exact: true })).toBeVisible();
});
test('level selection keeps later levels locked', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Choose level', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Level 1', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Level 11, locked', exact: true })).toBeDisabled();
});
test('blocked storage and audio do not block play', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('denied');
      },
    });
    Object.defineProperty(window, 'AudioContext', { value: undefined });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'New game', exact: true }).click();
  await expect(page.locator('#level-label')).toHaveText('Level 1 / 11');
  await expect(page.locator('#save-note')).toContainText('Storage unavailable');
});
test('corrupt run is discarded without losing high score', async ({ page }) => {
  await page.addInitScript(
    (key) =>
      localStorage.setItem(
        key,
        JSON.stringify({
          unlocked: 4,
          highScore: 12500,
          muted: false,
          run: { level: 1, version: 1 },
        }),
      ),
    saveKey,
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Start a fresh game' })).toBeVisible();
  await expect(page.locator('#best')).toContainText('0012500');
});
for (const [width, height] of [
  [320, 568],
  [390, 844],
  [844, 390],
  [768, 1024],
  [1440, 900],
])
  test(`layout and pointer controls at ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await page.getByRole('button', { name: 'New game', exact: true }).click();
    const canvas = await page.locator('#game').boundingBox();
    expect(canvas).not.toBeNull();
    expect(Math.abs(canvas!.width - canvas!.height)).toBeLessThan(1);
    expect(canvas!.x).toBeGreaterThanOrEqual(0);
    expect(canvas!.x + canvas!.width).toBeLessThanOrEqual(width);
    const right = page.getByRole('button', { name: 'Move right', exact: true });
    await right.scrollIntoViewIfNeeded();
    const rect = (await right.boundingBox())!;
    await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(500);
    await page.mouse.move(0, 0);
    await page.mouse.up();
    await page.locator('#pause').click();
    expect((await saved(page)).ball.input).toBe(0);
    await expect(page.locator('#screen-message')).toContainText('Paused');
    await page.screenshot({
      path: `test-results/layout-${width}-${height}-${test.info().project.name}.png`,
      fullPage: true,
    });
  });
test('loads all assets beneath the GitHub Pages repository path', async ({ page }) => {
  const failed: string[] = [];
  page.on('response', (r) => {
    if (r.status() >= 400) failed.push(r.url());
  });
  await page.goto('/bounceGame/');
  await page.getByRole('button', { name: 'New game', exact: true }).click();
  await expect(page.locator('#level-label')).toHaveText('Level 1 / 11');
  await page.keyboard.press('Escape');
  expect(failed).toEqual([]);
});
test('focus interruption clears a held key and saves a paused run', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'New game', exact: true }).click();
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(150);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  const run = await saved(page);
  expect(run.mode).toBe('paused');
  expect(run.ball.input).toBe(0);
  await page.keyboard.up('ArrowRight');
});
test('two-finger touch holds direction and jump together and releases cleanly', async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== 'chromium',
    'Native multi-touch injection is Chromium-only; other engines cover pointer cancellation.',
  );
  await page.setViewportSize({ width: 390, height: 844 });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await page.goto('/');
  await page.getByRole('button', { name: 'New game', exact: true }).click();
  const r = (await page.getByRole('button', { name: 'Move right', exact: true }).boundingBox())!,
    j = (await page.getByRole('button', { name: 'Jump', exact: true }).boundingBox())!;
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [
      { id: 1, x: r.x + r.width / 2, y: r.y + r.height / 2 },
      { id: 2, x: j.x + j.width / 2, y: j.y + j.height / 2 },
    ],
  });
  await page.waitForTimeout(500);
  await expect(page.locator('[data-control="right"]')).toHaveClass(/pressed/);
  await expect(page.locator('[data-control="jump"]')).toHaveClass(/pressed/);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  await expect(page.locator('[data-control="right"]')).not.toHaveClass(/pressed/);
  await expect(page.locator('[data-control="jump"]')).not.toHaveClass(/pressed/);
  await page.locator('#pause').click();
  expect((await saved(page)).ball.x).toBeGreaterThan(30);
});
test('renders every unlocked original level from the menu', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(
    (key) => localStorage.setItem(key, JSON.stringify({ unlocked: 11, highScore: 0, muted: true })),
    saveKey,
  );
  for (let id = 1; id <= 11; id++) {
    await page.goto('/');
    await page.getByRole('button', { name: 'Choose level', exact: true }).click();
    await page.getByRole('button', { name: `Level ${id}`, exact: true }).click();
    await expect(page.locator('#level-label')).toHaveText(`Level ${id} / 11`);
    await page.keyboard.press('Escape');
    await expect(page.locator('#screen-message')).toContainText('Paused');
  }
  expect(errors).toEqual([]);
});
