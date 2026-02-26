/**
 * PUBLIC ROLE — 12 procedures (studioProcedure)
 *
 * What a public/unauthenticated user can do:
 * - Browse class catalog (filter by season, type, level)
 * - View class details
 * - View published events
 * - Register for a class (creates family + student + enrollment)
 * - Validate promo codes
 * - View active waivers for registration
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { publicCaller } from '../helpers/trpc-caller';
import { seed, teardown, ids } from '../helpers/seed';

beforeAll(async () => { await seed(); });
afterAll(async () => { await teardown(); });

describe('PUBLIC: Catalog Browsing', () => {
  it('catalog.listClasses — lists public classes', async () => {
    const caller = publicCaller();
    const classes = await caller.catalog.listClasses({});
    expect(Array.isArray(classes)).toBe(true);
    expect(classes.length).toBeGreaterThanOrEqual(1);
    expect(classes[0]).toHaveProperty('name');
    expect(classes[0]).toHaveProperty('start_time');
  });

  it('catalog.getClass — gets class detail by ID', async () => {
    const caller = publicCaller();
    const cls = await caller.catalog.getClass({ classId: ids.class });
    expect(cls).toBeTruthy();
    expect(cls.name).toBe('Beginner Ballet - Mon 4pm');
  });

  it('catalog.getSeasons — lists seasons', async () => {
    const caller = publicCaller();
    const seasons = await caller.catalog.getSeasons();
    expect(seasons.length).toBeGreaterThanOrEqual(1);
    expect(seasons[0]).toHaveProperty('name');
  });

  it('catalog.getClassTypes — lists class types', async () => {
    const caller = publicCaller();
    const types = await caller.catalog.getClassTypes();
    expect(types.length).toBeGreaterThanOrEqual(1);
    expect(types[0].name).toBe('Ballet');
  });

  it('catalog.getLevels — lists levels', async () => {
    const caller = publicCaller();
    const levels = await caller.catalog.getLevels();
    expect(levels.length).toBeGreaterThanOrEqual(1);
    expect(levels[0].name).toBe('Beginner');
  });

  it('catalog.getStudio — gets studio info', async () => {
    const caller = publicCaller();
    const studio = await caller.catalog.getStudio();
    expect(studio).toBeTruthy();
    expect(studio.slug).toBe('rhythm-grace');
  });
});

describe('PUBLIC: Events', () => {
  it('event.published — lists published events', async () => {
    const caller = publicCaller();
    const events = await caller.event.published();
    expect(events.length).toBeGreaterThanOrEqual(1);
    expect(events[0].name).toBe('Spring Recital');
  });
});

describe('PUBLIC: Registration', () => {
  it('registration.getClassForRegistration — gets class for registration form', async () => {
    const caller = publicCaller();
    const cls = await caller.registration.getClassForRegistration({ classId: ids.class });
    expect(cls).toBeTruthy();
    expect(cls).toHaveProperty('name');
  });

  it('registration.checkExistingFamily — checks email for existing family', async () => {
    const caller = publicCaller();
    const result = await caller.registration.checkExistingFamily({ email: 'jane@test.studiosync.net' });
    expect(result).toHaveProperty('exists');
  });
});

describe('PUBLIC: Promo Codes', () => {
  it('promo.validate — validates a promo code', async () => {
    const caller = publicCaller();
    const result = await caller.promo.validate({ code: 'TEST10' });
    expect(result).toBeTruthy();
    expect(result.discount_type).toBe('percent');
    expect(result.discount_value).toBe(1000);
  });

  it('promo.validate — rejects invalid code', async () => {
    const caller = publicCaller();
    const result = await caller.promo.validate({ code: 'INVALID' });
    expect(result.valid).toBe(false);
  });
});

describe('PUBLIC: Waivers', () => {
  it('waiver.getForRegistration — gets active waivers', async () => {
    const caller = publicCaller();
    const waivers = await caller.waiver.getForRegistration({ classId: ids.class });
    expect(waivers.length).toBeGreaterThanOrEqual(1);
    expect(waivers[0].title).toBe('Liability Waiver');
  });
});
