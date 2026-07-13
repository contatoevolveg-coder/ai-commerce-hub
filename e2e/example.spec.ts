import { test, expect } from '@playwright/test';

test('has /health endpoint', async ({ request }) => {
  const response = await request.get('/health');
  expect(response.ok()).toBeTruthy();
  const json = await response.json();
  expect(json.status).toBe('ok');
});
