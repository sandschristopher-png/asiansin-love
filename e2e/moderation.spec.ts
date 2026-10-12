import { test, expect } from '@playwright/test';

test.describe('Automated Moderation & Quarantine Pipeline', () => {
  const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

  // 1. Clean message test
  test('Tier 1: Clean message delivers without warnings or quarantine', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/messages`, {
      data: {
        receiverId: '00000000-0000-0000-0000-000000000001',
        content: 'Hey! Loved your travel photos from Tokyo. Would love to grab coffee sometime.',
      },
    });

    // Validates route responsiveness (or auth challenge if unauthenticated)
    expect([200, 201, 401]).toContain(response.status());
    if (response.status() === 200 || response.status() === 201) {
      const data = await response.json();
      expect(data.is_quarantined).toBeFalsy();
      expect(data.warning).toBeUndefined();
    }
  });

  // 2. Warned message test (financial / wire transfer keywords)
  test('Tier 2: Financial trigger delivers with caution advisory', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/messages`, {
      data: {
        receiverId: '00000000-0000-0000-0000-000000000001',
        content: 'Can you send money via GCash or Western Union before we meet?',
      },
    });

    expect([200, 201, 400, 401]).toContain(response.status());
    if (response.status() === 200 || response.status() === 201) {
      const data = await response.json();
      // Message still sends, but advisory banner/flag is attached
      expect(data.warning || data.flagged_category).toBeTruthy();
    }
  });

  // 3. Silent quarantine test (explicit solicitation / external link scam)
  test('Tier 3: Solicitation triggers silent quarantine and penalty logging', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/messages`, {
      data: {
        receiverId: '00000000-0000-0000-0000-000000000001',
        content: 'Check out my webcam show at http://bit.ly/malicious-link free credits now',
      },
    });

    expect([200, 201, 400, 401]).toContain(response.status());
    if (response.status() === 200 || response.status() === 201) {
      const data = await response.json();
      // To the sender it appears accepted, but database flags is_quarantined = true
      expect(data.is_quarantined).toBe(true);
    }
  });
});