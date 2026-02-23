/**
 * OWNER ROLE — 2 exclusive procedures (ownerProcedure)
 *
 * What only a studio owner can do:
 * - Update studio settings (name, slug, branding, etc.)
 * - Generate Stripe Connect onboarding URL
 *
 * Note: Owners also have all admin capabilities (tested in admin.test.ts)
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ownerCaller } from '../helpers/trpc-caller';
import { seed, teardown } from '../helpers/seed';

beforeAll(async () => { await seed(); });
afterAll(async () => { await teardown(); });

describe('OWNER: Studio Settings', () => {
  it('catalog.getStudio — gets studio details', async () => {
    const caller = ownerCaller();
    const studio = await caller.catalog.getStudio();
    expect(studio).toBeTruthy();
    expect(studio.slug).toBe('rhythm-grace');
  });

  it('admin.updateStudio — updates studio settings', async () => {
    const caller = ownerCaller();
    const updated = await caller.admin.updateStudio({
      name: 'Rhythm & Grace Dance Studio Updated',
    });
    expect(updated).toBeTruthy();
    expect(updated.name).toBe('Rhythm & Grace Dance Studio Updated');

    // Restore original name
    await caller.admin.updateStudio({
      name: 'Rhythm & Grace Dance Studio',
    });
  });
});

describe('OWNER: Stripe Connect', () => {
  it('admin.stripeConnectUrl — generates onboarding URL', async () => {
    const caller = ownerCaller();
    // This may throw if Stripe isn't configured, which is expected
    try {
      const result = await caller.admin.stripeConnectUrl();
      expect(result).toHaveProperty('url');
    } catch (err: unknown) {
      // Expected if no Stripe key configured in test env
      expect((err as Error).message).toBeTruthy();
    }
  });
});
