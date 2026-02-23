/**
 * Test harness: creates tRPC callers for each role tier.
 *
 * Instead of going through HTTP, we call procedures directly via
 * tRPC's createCallerFactory, injecting mock contexts for each role.
 */
import { appRouter } from '@/server/routers/_app';
import { createCallerFactory, type TRPCContext } from '@/server/trpc';

const createCaller = createCallerFactory(appRouter);

// The one test studio
const TEST_STUDIO_ID = '11111111-1111-1111-1111-111111111111';
const TEST_OWNER_USER_ID = '049f4db8-bf91-4ac9-adef-e87af7981fd8';
const TEST_OWNER_STAFF_ID = '8143f03b-b10a-4333-9d63-d7a3b673feb4';

// These will be populated by seed()
let testInstructorStaffId: string | null = null;
let testFamilyId: string | null = null;
let testParentUserId: string | null = null;

export function setTestInstructor(staffId: string) {
  testInstructorStaffId = staffId;
}

export function setTestFamily(familyId: string, userId: string) {
  testFamilyId = familyId;
  testParentUserId = userId;
}

/**
 * Build a TRPCContext for a given role
 */
function buildContext(role: 'public' | 'parent' | 'instructor' | 'admin' | 'owner'): TRPCContext {
  switch (role) {
    case 'public':
      return {
        studioId: TEST_STUDIO_ID,
        studioSlug: 'rhythm-grace',
        userId: null,
        userRole: null,
        staffId: null,
        familyId: null,
      };
    case 'parent':
      return {
        studioId: TEST_STUDIO_ID,
        studioSlug: 'rhythm-grace',
        userId: testParentUserId ?? 'test-parent-user-id',
        userRole: null,
        staffId: null,
        familyId: testFamilyId ?? 'test-family-id',
      };
    case 'instructor':
      return {
        studioId: TEST_STUDIO_ID,
        studioSlug: 'rhythm-grace',
        userId: 'test-instructor-user-id',
        userRole: 'instructor',
        staffId: testInstructorStaffId ?? 'test-instructor-staff-id',
        familyId: null,
      };
    case 'admin':
      return {
        studioId: TEST_STUDIO_ID,
        studioSlug: 'rhythm-grace',
        userId: TEST_OWNER_USER_ID,
        userRole: 'admin',
        staffId: TEST_OWNER_STAFF_ID,
        familyId: null,
      };
    case 'owner':
      return {
        studioId: TEST_STUDIO_ID,
        studioSlug: 'rhythm-grace',
        userId: TEST_OWNER_USER_ID,
        userRole: 'owner',
        staffId: TEST_OWNER_STAFF_ID,
        familyId: null,
      };
  }
}

/** Create a tRPC caller for the given role */
export function callerAs(role: 'public' | 'parent' | 'instructor' | 'admin' | 'owner') {
  return createCaller(buildContext(role));
}

/** Convenience exports */
export const publicCaller = () => callerAs('public');
export const parentCaller = () => callerAs('parent');
export const instructorCaller = () => callerAs('instructor');
export const adminCaller = () => callerAs('admin');
export const ownerCaller = () => callerAs('owner');

export { TEST_STUDIO_ID, TEST_OWNER_USER_ID, TEST_OWNER_STAFF_ID };
