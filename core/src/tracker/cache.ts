import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Activity, SourceStatus } from './types.js';

export type CachedSnapshot = {
  activities: Activity[];
  sources: SourceStatus[];
  configured: boolean;
  checkedAt: string | null;
  nextAttempt: number;
  failures: number;
};

export type CachedRoomSchedule = {
  schedule: Record<string, Record<string, any>>;
  fetchedAt: number;
};

export type RoomType = 'classroom' | 'lab' | 'auditorium';

export const DAY_TO_NUMBER: Record<string, number> = {
  senin: 1,
  selasa: 2,
  rabu: 3,
  kamis: 4,
  jumat: 5,
};

export const NUMBER_TO_DAY: Record<number, string> = {
  1: 'senin',
  2: 'selasa',
  3: 'rabu',
  4: 'kamis',
  5: 'jumat',
};

export function timeStringToMinutes(timeStr: string | number): number {
  if (typeof timeStr === 'number') return timeStr;
  const [h, m] = String(timeStr).split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export type UserActivityState = {
  activityId: string;
  completion: NonNullable<Activity['completion']>;
  submittedLate?: boolean;
};

type Course = { id: number; fullname: string };
type CourseSync = { courseId: number; updatedAt: number; enrichAt: number | null };

export function openCache(path: string) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  // One atomic snapshot keeps readers from observing half-published source updates.
  const db = new DatabaseSync(path);

  // Migrate legacy rooms schema: drop old tables if day is not INTEGER, room_type is missing, or start_time is missing
  const roomColumns = db.prepare('PRAGMA table_info(rooms)').all() as Array<{
    name: string;
    type: string;
  }>;
  const hasRoomType = roomColumns.some((c) => c.name === 'room_type');
  const hasStartTime = roomColumns.some((c) => c.name === 'start_time');
  const dayIsInteger = roomColumns.some(
    (c) => c.name === 'day' && c.type.toUpperCase() === 'INTEGER',
  );
  if (roomColumns.length > 0 && (!hasRoomType || !dayIsInteger || !hasStartTime)) {
    db.exec('DROP TABLE IF EXISTS rooms;');
  }
  // Drop legacy separate room_schedules table if it exists
  db.exec('DROP TABLE IF EXISTS room_schedules;');

  db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS snapshot (id INTEGER PRIMARY KEY CHECK(id=1), data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY, course_id INTEGER NOT NULL, kind TEXT NOT NULL,
      name TEXT NOT NULL, description TEXT NOT NULL, url TEXT NOT NULL,
      opens_at INTEGER, due_at INTEGER, cutoff_at INTEGER, close_at INTEGER,
      time_limit INTEGER, updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS activities_course_idx ON activities(course_id);
    CREATE TABLE IF NOT EXISTS course_sync (
      course_id INTEGER PRIMARY KEY, updated_at INTEGER NOT NULL,
      enrich_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS user_courses (
      username TEXT NOT NULL, course_id INTEGER NOT NULL,
      course_name TEXT NOT NULL, updated_at INTEGER NOT NULL,
      PRIMARY KEY (username, course_id)
    );
    CREATE TABLE IF NOT EXISTS user_course_sync (
      username TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS user_activity_state (
      username TEXT NOT NULL, activity_id TEXT NOT NULL,
      completion TEXT NOT NULL, submitted_late INTEGER, updated_at INTEGER NOT NULL,
      PRIMARY KEY (username, activity_id)
    );
    CREATE INDEX IF NOT EXISTS user_activity_state_activity_idx ON user_activity_state(activity_id);
    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day INTEGER NOT NULL CHECK(day BETWEEN 1 AND 5),
      room_name TEXT NOT NULL,
      building TEXT,
      code TEXT,
      room_type TEXT NOT NULL CHECK(room_type IN ('classroom', 'lab', 'auditorium')),
      start_time INTEGER,
      end_time INTEGER,
      class_name TEXT,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS rooms_day_idx ON rooms(day);
    CREATE INDEX IF NOT EXISTS rooms_day_room_idx ON rooms(day, room_name);
    CREATE TABLE IF NOT EXISTS room_sync (
      id INTEGER PRIMARY KEY CHECK(id=1),
      updated_at INTEGER NOT NULL,
      checked_at INTEGER NOT NULL
    );`);
  const insertActivity =
    db.prepare(`INSERT INTO activities VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET course_id=excluded.course_id, kind=excluded.kind,
    name=excluded.name, description=excluded.description, url=excluded.url,
    opens_at=COALESCE(excluded.opens_at, activities.opens_at),
    due_at=COALESCE(excluded.due_at, activities.due_at),
    cutoff_at=COALESCE(excluded.cutoff_at, activities.cutoff_at),
    close_at=COALESCE(excluded.close_at, activities.close_at),
    time_limit=excluded.time_limit, updated_at=excluded.updated_at`);
  const insertCourse = db.prepare(`INSERT INTO user_courses VALUES (?, ?, ?, ?)`);
  const insertState = db.prepare(`INSERT INTO user_activity_state VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(username, activity_id) DO UPDATE SET
    completion=excluded.completion,
    submitted_late=COALESCE(excluded.submitted_late, user_activity_state.submitted_late),
    updated_at=excluded.updated_at`);
  function transaction(work: () => void) {
    db.exec('BEGIN IMMEDIATE');
    try {
      work();
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }
  return {
    read(): CachedSnapshot | null {
      const row = db.prepare('SELECT data FROM snapshot WHERE id=1').get();
      return row ? JSON.parse(String(row.data)) : null;
    },
    write(snapshot: CachedSnapshot) {
      db.prepare(
        'INSERT INTO snapshot VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET data=excluded.data',
      ).run(JSON.stringify(snapshot));
    },
    getActivitiesForUser(username: string): Activity[] {
      const rows = db
        .prepare(
          `SELECT a.*, uc.course_name, s.completion, s.submitted_late
        FROM user_courses uc JOIN activities a ON a.course_id=uc.course_id
        LEFT JOIN user_activity_state s ON s.username=uc.username AND s.activity_id=a.id
        WHERE uc.username=? ORDER BY a.id`,
        )
        .all(username);
      return rows.map((row) => ({
        id: String(row.id),
        kind: row.kind as Activity['kind'],
        courseId: Number(row.course_id),
        courseName: String(row.course_name),
        name: String(row.name),
        description: String(row.description),
        url: String(row.url),
        opensAt: row.opens_at === null ? null : Number(row.opens_at),
        dueAt: row.due_at === null ? null : Number(row.due_at),
        cutoffAt: row.cutoff_at === null ? null : Number(row.cutoff_at),
        closeAt: row.close_at === null ? null : Number(row.close_at),
        timeLimit: row.time_limit === null ? null : Number(row.time_limit),
        source: 'personal',
        completion: (row.completion || 'unknown') as Activity['completion'],
        ...(row.submitted_late !== null && {
          submittedLate: Boolean(row.submitted_late),
        }),
      }));
    },
    getUserCourses(username: string): { courses: Course[]; updatedAt: number } | null {
      const row = db
        .prepare('SELECT data, updated_at FROM user_course_sync WHERE username=?')
        .get(username);
      return row
        ? {
            courses: JSON.parse(String(row.data)) as Course[],
            updatedAt: Number(row.updated_at),
          }
        : null;
    },
    getCourseActivities(courseId: number): Activity[] {
      const rows = db.prepare('SELECT * FROM activities WHERE course_id=?').all(courseId);
      return rows.map((row) => ({
        id: String(row.id),
        kind: row.kind as Activity['kind'],
        courseId,
        courseName: '',
        name: String(row.name),
        description: String(row.description),
        url: String(row.url),
        opensAt: row.opens_at === null ? null : Number(row.opens_at),
        dueAt: row.due_at === null ? null : Number(row.due_at),
        cutoffAt: row.cutoff_at === null ? null : Number(row.cutoff_at),
        closeAt: row.close_at === null ? null : Number(row.close_at),
        timeLimit: row.time_limit === null ? null : Number(row.time_limit),
        source: 'personal',
        completion: 'unknown',
      }));
    },
    upsertActivities(activities: Activity[], updatedAt: number) {
      transaction(() => {
        for (const a of activities) {
          insertActivity.run(
            a.id,
            a.courseId,
            a.kind,
            a.name,
            a.description,
            a.url,
            a.opensAt,
            a.dueAt,
            a.cutoffAt,
            a.closeAt ?? null,
            a.timeLimit ?? null,
            updatedAt,
          );
        }
      });
    },
    replaceCourseActivities(courseId: number, activities: Activity[], updatedAt: number) {
      transaction(() => {
        for (const a of activities) {
          if (a.courseId !== courseId) throw new Error('Activity course mismatch');
          insertActivity.run(
            a.id,
            a.courseId,
            a.kind,
            a.name,
            a.description,
            a.url,
            a.opensAt,
            a.dueAt,
            a.cutoffAt,
            a.closeAt ?? null,
            a.timeLimit ?? null,
            updatedAt,
          );
        }
        // Calendar-only modules are absent from the course HTML; keep their
        // last-known definitions and dates until the calendar refresh updates them.
        db.prepare(
          `INSERT INTO course_sync VALUES (?, ?, NULL)
          ON CONFLICT(course_id) DO UPDATE SET updated_at=excluded.updated_at`,
        ).run(courseId, updatedAt);
      });
    },
    setUserCourses(username: string, courses: Course[], updatedAt: number) {
      transaction(() => {
        db.prepare('DELETE FROM user_courses WHERE username=?').run(username);
        for (const course of courses)
          insertCourse.run(username, course.id, course.fullname, updatedAt);
        db.prepare(
          `INSERT INTO user_course_sync VALUES (?, ?, ?)
          ON CONFLICT(username) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at`,
        ).run(username, JSON.stringify(courses), updatedAt);
      });
    },
    updateUserActivityState(
      username: string,
      states: UserActivityState[],
      updatedAt: number,
    ) {
      transaction(() => {
        for (const state of states) {
          insertState.run(
            username,
            state.activityId,
            state.completion,
            state.submittedLate === undefined ? null : Number(state.submittedLate),
            updatedAt,
          );
        }
      });
    },
    getCourseSyncStatus(courseIds: number[]): CourseSync[] {
      const query = db.prepare(
        'SELECT course_id, updated_at, enrich_at FROM course_sync WHERE course_id=?',
      );
      return courseIds.flatMap((id) => {
        const row = query.get(id);
        return row
          ? [
              {
                courseId: id,
                updatedAt: Number(row.updated_at),
                enrichAt: row.enrich_at === null ? null : Number(row.enrich_at),
              },
            ]
          : [];
      });
    },
    setCourseSyncStatus(
      courseId: number,
      updatedAt: number,
      enrichAt: number | null = null,
    ) {
      db.prepare(
        `INSERT INTO course_sync VALUES (?, ?, ?)
        ON CONFLICT(course_id) DO UPDATE SET updated_at=excluded.updated_at,
        enrich_at=excluded.enrich_at`,
      ).run(courseId, updatedAt, enrichAt);
    },
    getRoomSchedule(): CachedRoomSchedule | null {
      const sync = db.prepare('SELECT updated_at FROM room_sync WHERE id=1').get();
      if (!sync) return null;
      const rows = db
        .prepare(
          'SELECT day, room_name, start_time, end_time, class_name FROM rooms ORDER BY day, room_name, start_time',
        )
        .all();
      if (rows.length === 0) return null;

      const schedule: Record<string, Record<string, any>> = {};
      for (const d of [1, 2, 3, 4, 5]) {
        const dayName = NUMBER_TO_DAY[d];
        if (dayName) schedule[dayName] = {};
      }

      for (const row of rows) {
        const dayName = NUMBER_TO_DAY[Number(row.day)] || String(row.day);
        const roomName = String(row.room_name);
        schedule[dayName] ??= {};
        schedule[dayName][roomName] ??= [];

        if (row.start_time !== null && row.end_time !== null) {
          const startMinute = Number(row.start_time);
          const endMinute = Number(row.end_time);
          schedule[dayName][roomName].push({
            start: minutesToTimeString(startMinute),
            end: minutesToTimeString(endMinute),
            class: String(row.class_name || ''),
            startMinute,
            endMinute,
          });
        }
      }

      return { schedule, fetchedAt: Number(sync.updated_at) };
    },
    getRooms(dayFilter?: string | number) {
      let targetDay: number | undefined;
      if (typeof dayFilter === 'number') {
        targetDay = dayFilter;
      } else if (typeof dayFilter === 'string') {
        targetDay = DAY_TO_NUMBER[dayFilter.toLowerCase()];
      }

      const query =
        targetDay !== undefined
          ? db.prepare('SELECT * FROM rooms WHERE day=? ORDER BY room_name, start_time')
          : db.prepare('SELECT * FROM rooms ORDER BY day, room_name, start_time');
      const rows = targetDay !== undefined ? query.all(targetDay) : query.all();

      const roomsMap = new Map<
        string,
        {
          day: number;
          dayName: string;
          roomName: string;
          building: string;
          code: string;
          roomType: RoomType;
          isLab: boolean;
          isAuditorium: boolean;
          schedule: Array<{
            start: string;
            end: string;
            class: string;
            startMinute: number;
            endMinute: number;
          }>;
          updatedAt: number;
        }
      >();

      for (const row of rows) {
        const key = `${row.day}:${row.room_name}`;
        let entry = roomsMap.get(key);
        if (!entry) {
          const roomType = String(row.room_type || 'classroom') as RoomType;
          entry = {
            day: Number(row.day),
            dayName: NUMBER_TO_DAY[Number(row.day)] || String(row.day),
            roomName: String(row.room_name),
            building: String(row.building || ''),
            code: String(row.code || ''),
            roomType,
            isLab: roomType === 'lab',
            isAuditorium: roomType === 'auditorium',
            schedule: [],
            updatedAt: Number(row.updated_at),
          };
          roomsMap.set(key, entry);
        }

        if (row.start_time !== null && row.end_time !== null) {
          const startMinute = Number(row.start_time);
          const endMinute = Number(row.end_time);
          entry.schedule.push({
            start: minutesToTimeString(startMinute),
            end: minutesToTimeString(endMinute),
            class: String(row.class_name || ''),
            startMinute,
            endMinute,
          });
        }
      }

      return Array.from(roomsMap.values());
    },
    setRoomSchedule(
      schedule: Record<string, Record<string, any>>,
      updatedAt: number,
      parseMetadata?: (name: string) => {
        building: string;
        code: string;
        roomType?: RoomType;
        isLab?: boolean;
        isAuditorium?: boolean;
      },
    ) {
      const insertRoom = db.prepare(`
        INSERT INTO rooms (day, room_name, building, code, room_type, start_time, end_time, class_name, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const insertRoomSync = db.prepare(`
        INSERT INTO room_sync (id, updated_at, checked_at) VALUES (1, ?, ?)
        ON CONFLICT(id) DO UPDATE SET updated_at=excluded.updated_at, checked_at=excluded.checked_at
      `);
      transaction(() => {
        db.prepare('DELETE FROM rooms').run();
        for (const [dayKey, roomsMap] of Object.entries(schedule)) {
          if (!roomsMap || typeof roomsMap !== 'object') continue;
          const dayNum = DAY_TO_NUMBER[dayKey.toLowerCase()] ?? Number(dayKey);
          if (isNaN(dayNum) || dayNum < 1 || dayNum > 5) continue;

          for (const [roomName, slots] of Object.entries(roomsMap)) {
            const meta = parseMetadata
              ? parseMetadata(roomName)
              : { building: '', code: '', roomType: 'classroom' as RoomType };
            const roomType: RoomType =
              meta.roomType ||
              (meta.isAuditorium ? 'auditorium' : meta.isLab ? 'lab' : 'classroom');

            if (Array.isArray(slots) && slots.length > 0) {
              for (const slot of slots) {
                if (!slot) continue;
                const startMin = timeStringToMinutes(slot.start);
                const endMin = timeStringToMinutes(slot.end);
                const className = String(slot.class || '');
                insertRoom.run(
                  dayNum,
                  roomName,
                  meta.building,
                  meta.code,
                  roomType,
                  startMin,
                  endMin,
                  className,
                  updatedAt,
                );
              }
            } else {
              // Room exists on this day with no scheduled classes
              insertRoom.run(
                dayNum,
                roomName,
                meta.building,
                meta.code,
                roomType,
                null,
                null,
                null,
                updatedAt,
              );
            }
          }
        }
        insertRoomSync.run(updatedAt, updatedAt);
      });
    },
    getRoomSyncStatus(): { updatedAt: number; checkedAt: number } | null {
      const row = db
        .prepare('SELECT updated_at, checked_at FROM room_sync WHERE id=1')
        .get();
      return row
        ? { updatedAt: Number(row.updated_at), checkedAt: Number(row.checked_at) }
        : null;
    },
    touchRoomSync(checkedAt: number) {
      db.prepare(
        `INSERT INTO room_sync (id, updated_at, checked_at) VALUES (1, ?, ?)
        ON CONFLICT(id) DO UPDATE SET checked_at=excluded.checked_at`,
      ).run(checkedAt, checkedAt);
    },
    close: () => db.close(),
  };
}
