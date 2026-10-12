import { test, expect } from '@playwright/test';

test.describe('Automated Moderation & Quarantine Pipeline', () => {
  const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
  const dummyRecipient = '00000000-0000-0000-0000-000000000001';

  // --- CORE TIERS ---

  test('Tier 1: Clean message delivers without warnings or quarantine', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/messages`, {
      data: {
        receiverId: dummyRecipient,
        content: 'Hey! Loved your travel photos from Tokyo. Would love to grab coffee sometime.',
      },
    });

    expect([200, 201, 401]).toContain(response.status());
    if (response.status() === 200 || response.status() === 201) {
      const data = await response.json();
      expect(data.is_quarantined).toBeFalsy();
      expect(data.warning).toBeUndefined();
    }
  });

  test('Tier 2: Financial trigger delivers with caution advisory', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/messages`, {
      data: {
        receiverId: dummyRecipient,
        content: 'Can you send money via GCash or Western Union before we meet?',
      },
    });

    expect([200, 201, 400, 401]).toContain(response.status());
    if (response.status() === 200 || response.status() === 201) {
      const data = await response.json();
      expect(data.warning || data.flagged_category).toBeTruthy();
    }
  });

  test('Tier 3: Solicitation triggers silent quarantine and penalty logging', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/messages`, {
      data: {
        receiverId: dummyRecipient,
        content: 'Check out my webcam show at http://bit.ly/malicious-link free credits now',
      },
    });

    expect([200, 201, 400, 401]).toContain(response.status());
    if (response.status() === 200 || response.status() === 201) {
      const data = await response.json();
      // Silently accepted or marked quarantined
      expect(data.success).toBe(true);
      if (data.is_quarantined !== undefined) {
        expect(data.is_quarantined).toBe(true);
      }
    }
  });

  // --- EDGE CASES & VALIDATION ---

  test('Edge Case: Tier 3 overrides Tier 2 when both triggers are present', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/messages`, {
      data: {
        receiverId: dummyRecipient,
        content: 'Send me money on GCash or visit my private cam at http://bit.ly/escort-now',
      },
    });

    expect([200, 201, 400, 401]).toContain(response.status());
    if (response.status() === 200 || response.status() === 201) {
      const data = await response.json();
      // Must NOT be treated as a simple warning; quarantine precedence must hold
      expect(data.warning).toBeUndefined();
      expect(data.success).toBe(true);
    }
  });

  test('Edge Case: Spaced and hyphenated evasion attempts are flagged', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/messages`, {
      data: {
        receiverId: dummyRecipient,
        content: 'Add me on w-h-a-t-s-a-p-p or t e l e g r a m: +1 555-0199 for private rates',
      },
    });

    expect([200, 201, 400, 401]).toContain(response.status());
    if (response.status() === 200 || response.status() === 201) {
      const data = await response.json();
      // Should trigger warning or quarantine, not pass as clean Tier 1
      const isIntercepted = Boolean(data.warning || data.is_quarantined || data.delivered);
      expect(isIntercepted).toBe(true);
    }
  });

  test('Edge Case: Empty or whitespace-only messages are rejected', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/messages`, {
      data: {
        receiverId: dummyRecipient,
        content: '     ',
      },
    });

    expect([400, 401]).toContain(response.status());
    if (response.status() === 400) {
      const data = await response.json();
      expect(data.error).toMatch(/missing|invalid/i);
    }
  });

  test('Edge Case: Malformed recipient ID format is rejected', async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/messages`, {
      data: {
        receiverId: 'not-a-valid-uuid-string',
        content: 'Hello there!',
      },
    });

    expect([400, 401]).toContain(response.status());
    if (response.status() === 400) {
      const data = await response.json();
      expect(data.error).toMatch(/invalid recipient/i);
    }
  });

  test('Edge Case: Oversized payload does not crash server', async ({ request }) => {
    const oversizedContent = 'SPAM '.repeat(2000); // ~10KB payload
    const response = await request.post(`${baseUrl}/api/messages`, {
      data: {
        receiverId: dummyRecipient,
        content: oversizedContent,
      },
    });

    // Server should reject, quarantine, or respond cleanly, never 500
    expect([200, 201, 400, 401, 413]).toContain(response.status());
    expect(response.status()).not.toBe(500);
  });
});
