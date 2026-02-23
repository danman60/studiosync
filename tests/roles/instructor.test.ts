/**
 * INSTRUCTOR ROLE — 17 procedures (instructorProcedure)
 *
 * What an instructor can do:
 * - View assigned classes (own classes only, unless admin)
 * - View class roster (enrolled students)
 * - Manage class sessions (get/create, add notes)
 * - Mark and view attendance
 * - View attendance summary/stats
 * - View limited student info (name, age, medical)
 * - Create/edit progress marks (scores, grades, comments)
 * - View announcements for their classes
 * - View media for their classes
 * - Clock in/out (time tracking)
 * - View own time clock entries
 * - View private lesson schedule
 * - Manage availability
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { instructorCaller, setTestInstructor } from '../helpers/trpc-caller';
import { seed, teardown, ids } from '../helpers/seed';

beforeAll(async () => {
  await seed();
  setTestInstructor(ids.instructorStaff);
});
afterAll(async () => { await teardown(); });

describe('INSTRUCTOR: Class Management', () => {
  it('instructor.myClasses — lists assigned classes', async () => {
    const caller = instructorCaller();
    const classes = await caller.instructor.myClasses();
    expect(classes.length).toBeGreaterThanOrEqual(1);
    expect(classes[0].name).toBe('Beginner Ballet - Mon 4pm');
  });

  it('instructor.classRoster — lists enrolled students', async () => {
    const caller = instructorCaller();
    const roster = await caller.instructor.classRoster({ classId: ids.class });
    expect(roster.length).toBeGreaterThanOrEqual(1);
    expect(roster[0]).toHaveProperty('students');
  });

  it('instructor.studentInfo — gets limited student details', async () => {
    const caller = instructorCaller();
    const info = await caller.instructor.studentInfo({ studentId: ids.student, classId: ids.class });
    expect(info).toBeTruthy();
    expect(info.first_name).toBe('Emma');
  });
});

describe('INSTRUCTOR: Sessions & Attendance', () => {
  it('instructor.getSession — gets/creates session for a date', async () => {
    const caller = instructorCaller();
    const session = await caller.instructor.getSession({
      classId: ids.class,
      date: '2026-02-22',
    });
    expect(session).toBeTruthy();
    expect(session).toHaveProperty('session_date');
  });

  it('instructor.markAttendance — marks attendance for students', async () => {
    const caller = instructorCaller();
    const result = await caller.instructor.markAttendance({
      sessionId: ids.classSession,
      records: [
        { studentId: ids.student, status: 'present', notes: 'On time' },
      ],
    });
    expect(result).toBeTruthy();
  });

  it('instructor.getAttendance — gets attendance for a session', async () => {
    const caller = instructorCaller();
    const attendance = await caller.instructor.getAttendance({
      sessionId: ids.classSession,
    });
    expect(Array.isArray(attendance)).toBe(true);
  });

  it('instructor.attendanceSummary — gets attendance stats', async () => {
    const caller = instructorCaller();
    const summary = await caller.instructor.attendanceSummary({
      classId: ids.class,
    });
    expect(summary).toBeTruthy();
  });

  it('instructor.updateSessionNotes — saves session notes', async () => {
    const caller = instructorCaller();
    const result = await caller.instructor.updateSessionNotes({
      sessionId: ids.classSession,
      notes: 'Worked on pirouettes today',
    });
    expect(result).toBeTruthy();
  });
});

describe('INSTRUCTOR: Progress Marks', () => {
  it('instructor.listProgressMarks — lists marks for a class', async () => {
    const caller = instructorCaller();
    const marks = await caller.instructor.listProgressMarks({
      classId: ids.class,
    });
    expect(Array.isArray(marks)).toBe(true);
  });

  it('instructor.upsertProgressMark — creates/updates a mark', async () => {
    const caller = instructorCaller();
    const mark = await caller.instructor.upsertProgressMark({
      classId: ids.class,
      studentId: ids.student,
      period: 'spring-2026',
      category: 'Technique',
      score: 85,
      mark: 'B+',
      comments: 'Strong fundamentals, work on turnout',
    });
    expect(mark).toBeTruthy();
    expect(mark.score).toBe(85);
  });
});

describe('INSTRUCTOR: Announcements', () => {
  it('announcement.instructorFeed — views relevant announcements', async () => {
    const caller = instructorCaller();
    const feed = await caller.announcement.instructorFeed();
    expect(feed.length).toBeGreaterThanOrEqual(1);
  });
});

describe('INSTRUCTOR: Media', () => {
  it('media.myClassMedia — views media for assigned classes', async () => {
    const caller = instructorCaller();
    const media = await caller.media.myClassMedia({ classId: ids.class });
    expect(Array.isArray(media)).toBe(true);
  });
});

describe('INSTRUCTOR: Time Clock', () => {
  it('timeClock.currentStatus — checks clock-in status', async () => {
    const caller = instructorCaller();
    const status = await caller.timeClock.currentStatus();
    // Should not be clocked in initially
    expect(status).toBeNull();
  });

  it('timeClock.clockIn — clocks in', async () => {
    const caller = instructorCaller();
    const entry = await caller.timeClock.clockIn({ notes: 'Starting shift' });
    expect(entry).toBeTruthy();
    expect(entry.notes).toBe('Starting shift');
    expect(entry.clock_out).toBeNull();
  });

  it('timeClock.clockOut — clocks out', async () => {
    const caller = instructorCaller();
    const entry = await caller.timeClock.clockOut();
    expect(entry).toBeTruthy();
    expect(entry.clock_out).toBeTruthy();
    expect(entry.duration_minutes).toBeGreaterThanOrEqual(0);
  });

  it('timeClock.myEntries — lists own entries', async () => {
    const caller = instructorCaller();
    const entries = await caller.timeClock.myEntries();
    expect(entries.length).toBeGreaterThanOrEqual(1);
  });
});

describe('INSTRUCTOR: Private Lessons', () => {
  it('privateLesson.myLessons — views assigned lessons', async () => {
    const caller = instructorCaller();
    const lessons = await caller.privateLesson.myLessons();
    expect(Array.isArray(lessons)).toBe(true);
  });

  it('privateLesson.getAvailability — views availability', async () => {
    const caller = instructorCaller();
    const availability = await caller.privateLesson.getAvailability();
    expect(Array.isArray(availability)).toBe(true);
  });

  it('privateLesson.setAvailability — sets availability slots', async () => {
    const caller = instructorCaller();
    const result = await caller.privateLesson.setAvailability([
      { day_of_week: 2, start_time: '10:00', end_time: '12:00' },
      { day_of_week: 4, start_time: '14:00', end_time: '16:00' },
    ]);
    expect(result).toBeTruthy();
  });
});
