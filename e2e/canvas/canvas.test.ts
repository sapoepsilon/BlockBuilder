/// file: e2e/canvas/canvas.test.ts
import { test, expect } from '@playwright/test';

test.describe('Canvas Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('canvas element is visible', async ({ page }) => {
    const canvas = await page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('control panel displays initial state', async ({ page }) => {
    const controlPanel = await page.locator('div:text("Canvas Metrics")');
    await expect(controlPanel).toBeVisible();
    
    // Check initial zoom level
    const zoomText = await page.locator('text=Zoom Level: 100%');
    await expect(zoomText).toBeVisible();
  });

// TODO: I need to add these: 
/* 
 test('control panel is draggable', async ({ page }) => {
  test('canvas responds to zoom', async ({ page }) => {
  test('canvas responds to mouse drag', async ({ page }) => {
 */
});