/**
 * Test data seeder — creates the minimal data set needed to exercise
 * all role capabilities. Runs once before the test suite.
 *
 * Creates: instructor staff, family, student, season, class_type, level,
 * class, enrollment, invoice, event, announcement, waiver, promo code,
 * message template
 */
import { createClient } from '@supabase/supabase-js';

const STUDIO_ID = '11111111-1111-1111-1111-111111111111';
const OWNER_STAFF_ID = '8143f03b-b10a-4333-9d63-d7a3b673feb4';

// IDs for seeded records (exported so tests can reference them)
export const ids = {
  studio: STUDIO_ID,
  ownerStaff: OWNER_STAFF_ID,
  instructorStaff: '',
  family: '',
  student: '',
  season: '',
  classType: '',
  level: '',
  class: '',
  enrollment: '',
  invoice: '',
  invoiceLineItem: '',
  event: '',
  announcement: '',
  waiver: '',
  promoCode: '',
  messageTemplate: '',
  classSession: '',
};

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: 'studiosync' as 'public' }, auth: { persistSession: false } },
  );
}

/** Helper: insert + throw on error */
async function insert<T extends Record<string, unknown>>(
  sb: ReturnType<typeof supabase>,
  table: string,
  row: T,
): Promise<{ id: string }> {
  const { data, error } = await sb.from(table).insert(row).select('id').single();
  if (error) throw new Error(`Seed ${table} failed: ${error.message}`);
  return data as { id: string };
}

export async function seed() {
  const sb = supabase();

  // Clean up any leftover test data from previous runs
  await teardown();

  // 1. Instructor staff (auth_user_id null — bypassed in tests via mock context)
  const instructor = await insert(sb, 'staff', {
    studio_id: STUDIO_ID,
    auth_user_id: null,
    role: 'instructor',
    display_name: 'Test Instructor',
    email: 'instructor@test.studiosync.net',
  });
  ids.instructorStaff = instructor.id;

  // 2. Family (auth_user_id null — bypassed in tests via mock context)
  const family = await insert(sb, 'families', {
    studio_id: STUDIO_ID,
    auth_user_id: null,
    parent_first_name: 'Jane',
    parent_last_name: 'Doe',
    email: 'jane@test.studiosync.net',
    phone: '555-0100',
  });
  ids.family = family.id;

  // 3. Student
  const student = await insert(sb, 'students', {
    studio_id: STUDIO_ID,
    family_id: family.id,
    first_name: 'Emma',
    last_name: 'Doe',
    date_of_birth: '2018-06-15',
    gender: 'female',
  });
  ids.student = student.id;

  // 4. Season
  const season = await insert(sb, 'seasons', {
    studio_id: STUDIO_ID,
    name: 'Test Season 2026',
    start_date: '2026-01-01',
    end_date: '2026-06-30',
    is_current: true,
  });
  ids.season = season.id;

  // 5. Class type
  const classType = await insert(sb, 'class_types', {
    studio_id: STUDIO_ID,
    name: 'Ballet',
    color: '#ec4899',
  });
  ids.classType = classType.id;

  // 6. Level
  const level = await insert(sb, 'levels', {
    studio_id: STUDIO_ID,
    name: 'Beginner',
  });
  ids.level = level.id;

  // 7. Class (assigned to test instructor)
  const cls = await insert(sb, 'classes', {
    studio_id: STUDIO_ID,
    season_id: season.id,
    class_type_id: classType.id,
    level_id: level.id,
    instructor_id: instructor.id,
    name: 'Beginner Ballet - Mon 4pm',
    day_of_week: 1,
    start_time: '16:00',
    end_time: '17:00',
    room: 'Studio A',
    monthly_price: 8500,
    is_public: true,
  });
  ids.class = cls.id;

  // 8. Enrollment
  const enrollment = await insert(sb, 'enrollments', {
    studio_id: STUDIO_ID,
    class_id: cls.id,
    student_id: student.id,
    family_id: family.id,
    status: 'active',
    enrolled_at: new Date().toISOString(),
  });
  ids.enrollment = enrollment.id;

  // 9. Invoice with line item
  const invoice = await insert(sb, 'invoices', {
    studio_id: STUDIO_ID,
    family_id: family.id,
    invoice_number: 'TEST-001',
    issue_date: '2026-02-01',
    due_date: '2026-02-15',
    status: 'sent',
  });
  ids.invoice = invoice.id;

  const lineItem = await insert(sb, 'invoice_line_items', {
    studio_id: STUDIO_ID,
    invoice_id: invoice.id,
    description: 'Beginner Ballet - February',
    quantity: 1,
    unit_price: 8500,
    total: 8500,
    enrollment_id: enrollment.id,
  });
  ids.invoiceLineItem = lineItem.id;

  // Update invoice totals
  await sb.from('invoices').update({
    subtotal: 8500,
    total: 8500,
  }).eq('id', invoice.id);

  // 10. Event
  const event = await insert(sb, 'events', {
    studio_id: STUDIO_ID,
    name: 'Spring Recital',
    description: 'Annual spring show',
    event_date: '2026-05-15',
    event_time: '19:00',
    location: 'Main Theater',
    ticket_price: 1500,
    max_tickets: 200,
    status: 'published',
    is_public: true,
  });
  ids.event = event.id;

  // 11. Announcement (published)
  const ann = await insert(sb, 'announcements', {
    studio_id: STUDIO_ID,
    author_id: OWNER_STAFF_ID,
    title: 'Welcome to the new season!',
    body: 'We are excited to start the 2026 season.',
    target_type: 'all',
    is_draft: false,
    published_at: new Date().toISOString(),
  });
  ids.announcement = ann.id;

  // 12. Waiver
  const waiver = await insert(sb, 'waivers', {
    studio_id: STUDIO_ID,
    season_id: season.id,
    title: 'Liability Waiver',
    content: 'By signing this waiver you agree to...',
    is_required: true,
    is_active: true,
  });
  ids.waiver = waiver.id;

  // 13. Promo code
  const promo = await insert(sb, 'promo_codes', {
    studio_id: STUDIO_ID,
    code: 'TEST10',
    description: '10% off for testing',
    discount_type: 'percent',
    discount_value: 1000,
    applies_to: 'all',
    is_active: true,
  });
  ids.promoCode = promo.id;

  // 14. Message template
  const tmpl = await insert(sb, 'message_templates', {
    studio_id: STUDIO_ID,
    name: 'Welcome Email',
    subject: 'Welcome to {{studio_name}}!',
    body: 'Hi {{parent_name}}, welcome to our studio!',
    category: 'general',
    merge_fields: ['studio_name', 'parent_name'],
    is_active: true,
  });
  ids.messageTemplate = tmpl.id;

  // 15. Class session (for attendance tests)
  const session = await insert(sb, 'class_sessions', {
    studio_id: STUDIO_ID,
    class_id: cls.id,
    session_date: '2026-02-22',
    start_time: '16:00',
    end_time: '17:00',
    status: 'scheduled',
  });
  ids.classSession = session.id;

  return ids;
}

export async function teardown() {
  const sb = supabase();

  // Delete in reverse dependency order
  const tables = [
    'attendance', 'class_sessions', 'time_clock_entries', 'family_tags',
    'scheduled_messages', 'discount_applications', 'waiver_signatures',
    'notification_log', 'notification_preferences', 'messages',
    'progress_marks', 'ticket_orders', 'invoice_line_items', 'invoices',
    'enrollments', 'classes', 'levels', 'class_types', 'seasons',
    'events', 'announcements', 'waivers', 'promo_codes', 'message_templates',
    'students', 'families',
  ];

  for (const table of tables) {
    await sb.from(table).delete().eq('studio_id', STUDIO_ID);
  }

  // Delete test staff (not the owner)
  await sb.from('staff').delete()
    .eq('studio_id', STUDIO_ID)
    .is('auth_user_id', null);
}
