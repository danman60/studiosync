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

export async function seed() {
  const sb = supabase();

  // 1. Instructor staff (fake auth_user_id — we bypass auth in tests)
  const { data: instructor } = await sb.from('staff').insert({
    studio_id: STUDIO_ID,
    auth_user_id: 'test-instructor-user-id',
    role: 'instructor',
    display_name: 'Test Instructor',
    email: 'instructor@test.studiosync.net',
  }).select('id').single();
  ids.instructorStaff = instructor!.id;

  // 2. Family
  const { data: family } = await sb.from('families').insert({
    studio_id: STUDIO_ID,
    auth_user_id: 'test-parent-user-id',
    parent_first_name: 'Jane',
    parent_last_name: 'Doe',
    email: 'jane@test.studiosync.net',
    phone: '555-0100',
  }).select('id').single();
  ids.family = family!.id;

  // 3. Student
  const { data: student } = await sb.from('students').insert({
    studio_id: STUDIO_ID,
    family_id: family!.id,
    first_name: 'Emma',
    last_name: 'Doe',
    date_of_birth: '2018-06-15',
    gender: 'female',
  }).select('id').single();
  ids.student = student!.id;

  // 4. Season
  const { data: season } = await sb.from('seasons').insert({
    studio_id: STUDIO_ID,
    name: 'Test Season 2026',
    start_date: '2026-01-01',
    end_date: '2026-06-30',
    is_current: true,
  }).select('id').single();
  ids.season = season!.id;

  // 5. Class type
  const { data: classType } = await sb.from('class_types').insert({
    studio_id: STUDIO_ID,
    name: 'Ballet',
    color: '#ec4899',
  }).select('id').single();
  ids.classType = classType!.id;

  // 6. Level
  const { data: level } = await sb.from('levels').insert({
    studio_id: STUDIO_ID,
    name: 'Beginner',
  }).select('id').single();
  ids.level = level!.id;

  // 7. Class (assigned to test instructor)
  const { data: cls } = await sb.from('classes').insert({
    studio_id: STUDIO_ID,
    season_id: season!.id,
    class_type_id: classType!.id,
    level_id: level!.id,
    instructor_id: instructor!.id,
    name: 'Beginner Ballet - Mon 4pm',
    day_of_week: 1,
    start_time: '16:00',
    end_time: '17:00',
    room: 'Studio A',
    monthly_price: 8500,
    is_public: true,
  }).select('id').single();
  ids.class = cls!.id;

  // 8. Enrollment
  const { data: enrollment } = await sb.from('enrollments').insert({
    studio_id: STUDIO_ID,
    class_id: cls!.id,
    student_id: student!.id,
    family_id: family!.id,
    status: 'active',
    enrolled_at: new Date().toISOString(),
  }).select('id').single();
  ids.enrollment = enrollment!.id;

  // 9. Invoice with line item
  const { data: invoice } = await sb.from('invoices').insert({
    studio_id: STUDIO_ID,
    family_id: family!.id,
    invoice_number: 'TEST-001',
    issue_date: '2026-02-01',
    due_date: '2026-02-15',
    status: 'sent',
  }).select('id').single();
  ids.invoice = invoice!.id;

  const { data: lineItem } = await sb.from('invoice_line_items').insert({
    studio_id: STUDIO_ID,
    invoice_id: invoice!.id,
    description: 'Beginner Ballet - February',
    quantity: 1,
    unit_price: 8500,
    total: 8500,
    enrollment_id: enrollment!.id,
  }).select('id').single();
  ids.invoiceLineItem = lineItem!.id;

  // Update invoice totals
  await sb.from('invoices').update({
    subtotal: 8500,
    total: 8500,
  }).eq('id', invoice!.id);

  // 10. Event
  const { data: event } = await sb.from('events').insert({
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
  }).select('id').single();
  ids.event = event!.id;

  // 11. Announcement (published)
  const { data: ann } = await sb.from('announcements').insert({
    studio_id: STUDIO_ID,
    author_id: OWNER_STAFF_ID,
    title: 'Welcome to the new season!',
    body: 'We are excited to start the 2026 season.',
    target_type: 'all',
    is_draft: false,
    published_at: new Date().toISOString(),
  }).select('id').single();
  ids.announcement = ann!.id;

  // 12. Waiver
  const { data: waiver } = await sb.from('waivers').insert({
    studio_id: STUDIO_ID,
    season_id: season!.id,
    title: 'Liability Waiver',
    content: 'By signing this waiver you agree to...',
    is_required: true,
    is_active: true,
  }).select('id').single();
  ids.waiver = waiver!.id;

  // 13. Promo code
  const { data: promo } = await sb.from('promo_codes').insert({
    studio_id: STUDIO_ID,
    code: 'TEST10',
    description: '10% off for testing',
    discount_type: 'percent',
    discount_value: 1000,
    applies_to: 'all',
    is_active: true,
  }).select('id').single();
  ids.promoCode = promo!.id;

  // 14. Message template
  const { data: tmpl } = await sb.from('message_templates').insert({
    studio_id: STUDIO_ID,
    name: 'Welcome Email',
    subject: 'Welcome to {{studio_name}}!',
    body: 'Hi {{parent_name}}, welcome to our studio!',
    category: 'general',
    merge_fields: ['studio_name', 'parent_name'],
    is_active: true,
  }).select('id').single();
  ids.messageTemplate = tmpl!.id;

  // 15. Class session (for attendance tests)
  const { data: session } = await sb.from('class_sessions').insert({
    studio_id: STUDIO_ID,
    class_id: cls!.id,
    session_date: '2026-02-22',
    start_time: '16:00',
    end_time: '17:00',
    status: 'scheduled',
  }).select('id').single();
  ids.classSession = session!.id;

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
    .eq('auth_user_id', 'test-instructor-user-id');
}
