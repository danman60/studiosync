/**
 * PARENT ROLE — 27 procedures (protectedProcedure)
 *
 * What an authenticated parent/family can do:
 * - View dashboard overview (stats, upcoming classes)
 * - Manage their students (add, edit, list)
 * - View student progress marks and attendance
 * - View and pay invoices (Stripe PaymentIntent)
 * - View payment history
 * - View report cards
 * - Read/send messages to studio admin
 * - View published announcements (filtered to enrolled classes)
 * - View class media (public only)
 * - View published events + purchase tickets
 * - Sign waivers
 * - View/update notification preferences
 * - View tuition plans + request cancellation
 * - View private lesson schedule
 * - Update family profile
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { parentCaller, setTestFamily } from '../helpers/trpc-caller';
import { seed, teardown, ids } from '../helpers/seed';

beforeAll(async () => {
  await seed();
  setTestFamily(ids.family, 'test-parent-user-id');
});
afterAll(async () => { await teardown(); });

describe('PARENT: Dashboard', () => {
  it('portal.dashboardData — gets family dashboard overview', async () => {
    const caller = parentCaller();
    const data = await caller.portal.dashboardData();
    expect(data).toBeTruthy();
    expect(data).toHaveProperty('students');
    expect(data).toHaveProperty('enrollments');
  });
});

describe('PARENT: Student Management', () => {
  it('portal.listStudents — lists my students', async () => {
    const caller = parentCaller();
    const students = await caller.portal.listStudents();
    expect(students.length).toBeGreaterThanOrEqual(1);
    expect(students[0].first_name).toBe('Emma');
  });

  it('portal.addStudent — adds a new student', async () => {
    const caller = parentCaller();
    const student = await caller.portal.addStudent({
      first_name: 'Liam',
      last_name: 'Doe',
      date_of_birth: '2020-03-10',
      gender: 'male',
    });
    expect(student).toBeTruthy();
    expect(student.first_name).toBe('Liam');
  });

  it('portal.updateStudent — edits student info', async () => {
    const caller = parentCaller();
    const updated = await caller.portal.updateStudent({
      id: ids.student,
      medical_notes: 'Mild asthma',
    });
    expect(updated.medical_notes).toBe('Mild asthma');
  });
});

describe('PARENT: Progress & Attendance', () => {
  it('portal.studentProgressMarks — views progress marks', async () => {
    const caller = parentCaller();
    const marks = await caller.portal.studentProgressMarks({ studentId: ids.student });
    expect(Array.isArray(marks)).toBe(true);
  });

  it('portal.studentAttendance — views attendance records', async () => {
    const caller = parentCaller();
    const attendance = await caller.portal.studentAttendance({ studentId: ids.student });
    expect(Array.isArray(attendance)).toBe(true);
  });

  it('portal.reportCard — views student report card', async () => {
    const caller = parentCaller();
    const report = await caller.portal.reportCard({ studentId: ids.student });
    expect(report).toBeTruthy();
  });
});

describe('PARENT: Invoices & Payments', () => {
  it('invoice.myInvoices — lists my invoices', async () => {
    const caller = parentCaller();
    const invoices = await caller.invoice.myInvoices();
    expect(invoices.length).toBeGreaterThanOrEqual(1);
    expect(invoices[0].invoice_number).toBe('TEST-001');
  });

  it('invoice.myInvoiceDetail — gets invoice detail', async () => {
    const caller = parentCaller();
    const detail = await caller.invoice.myInvoiceDetail({ id: ids.invoice });
    expect(detail).toBeTruthy();
    expect(detail.invoice_number).toBe('TEST-001');
  });

  it('portal.listPayments — lists payment history', async () => {
    const caller = parentCaller();
    const payments = await caller.portal.listPayments();
    expect(Array.isArray(payments)).toBe(true);
  });
});

describe('PARENT: Messaging', () => {
  it('messaging.myMessages — views messages', async () => {
    const caller = parentCaller();
    const messages = await caller.messaging.myMessages();
    expect(Array.isArray(messages)).toBe(true);
  });

  it('messaging.parentSend — sends message to admin', async () => {
    const caller = parentCaller();
    const msg = await caller.messaging.parentSend({ body: 'Hello from test!' });
    expect(msg).toBeTruthy();
    expect(msg.body).toBe('Hello from test!');
  });

  it('messaging.unreadCount — gets unread count', async () => {
    const caller = parentCaller();
    const result = await caller.messaging.unreadCount();
    expect(typeof result.count).toBe('number');
  });
});

describe('PARENT: Announcements', () => {
  it('announcement.parentFeed — views published announcements', async () => {
    const caller = parentCaller();
    const feed = await caller.announcement.parentFeed();
    expect(feed.length).toBeGreaterThanOrEqual(1);
    expect(feed[0].title).toBe('Welcome to the new season!');
  });
});

describe('PARENT: Media', () => {
  it('media.classMedia — views public class media', async () => {
    const caller = parentCaller();
    const media = await caller.media.classMedia();
    expect(Array.isArray(media)).toBe(true);
  });
});

describe('PARENT: Events', () => {
  it('event.published — views published events', async () => {
    // Parents use the public studioProcedure for listing
    const caller = parentCaller();
    const events = await caller.event.published();
    expect(events.length).toBeGreaterThanOrEqual(1);
  });
});

describe('PARENT: Waivers', () => {
  it('waiver.myPendingWaivers — views waivers needing signature', async () => {
    const caller = parentCaller();
    const waivers = await caller.waiver.myPendingWaivers();
    expect(Array.isArray(waivers)).toBe(true);
  });

  it('waiver.mySignatures — views signed waivers', async () => {
    const caller = parentCaller();
    const sigs = await caller.waiver.mySignatures();
    expect(Array.isArray(sigs)).toBe(true);
  });
});

describe('PARENT: Notifications', () => {
  it('notification.getPreferences — gets notification preferences', async () => {
    const caller = parentCaller();
    const prefs = await caller.notification.getPreferences();
    expect(prefs).toBeTruthy();
  });
});

describe('PARENT: Profile', () => {
  it('portal.getProfile — gets family profile', async () => {
    const caller = parentCaller();
    const profile = await caller.portal.getProfile();
    expect(profile).toBeTruthy();
    expect(profile.parent_first_name).toBe('Jane');
  });

  it('portal.updateProfile — updates family profile', async () => {
    const caller = parentCaller();
    const updated = await caller.portal.updateProfile({
      phone: '555-0200',
    });
    expect(updated.phone).toBe('555-0200');
  });
});

describe('PARENT: Tuition', () => {
  it('tuition.myPlans — views tuition plans', async () => {
    const caller = parentCaller();
    const plans = await caller.tuition.myPlans();
    expect(Array.isArray(plans)).toBe(true);
  });
});

describe('PARENT: Private Lessons', () => {
  it('privateLesson.myChildLessons — views child lessons', async () => {
    const caller = parentCaller();
    const lessons = await caller.privateLesson.myChildLessons();
    expect(Array.isArray(lessons)).toBe(true);
  });
});
