import { createHmac } from 'node:crypto';
import { settings } from './tracker/config.js';
import { roleFor } from './tracker/roles.js';
import type { Activity } from './tracker/types.js';
import express from 'express';
import cookieParser from 'cookie-parser';
import { auth, requireSession, sessionUser } from './tracker/auth.js';
import { personalSnapshot } from './tracker/personal.js';
import { clearUserMoodleSession, MoodleSessionExpired } from './tracker/moodle.js';
import { createTracker } from './tracker/store.js';
import { defaultRoomTracker, type createRoomTracker } from './tracker/rooms.js';

export function createApp(
  tracker: Pick<ReturnType<typeof createTracker>, 'get'> = createTracker(),
  getPersonal = personalSnapshot,
  roomTracker: Pick<
    ReturnType<typeof createRoomTracker>,
    'getSchedule'
  > = defaultRoomTracker,
) {
  const app = express();
  app.disable('x-powered-by');
  app.use(cookieParser());
  app.use('/api', (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    res.set('X-Content-Type-Options', 'nosniff');
    next();
  });
  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/auth', auth);
  // Stable opaque IDs hide account aliases while keeping account-specific deadlines separate.
  // Rotating the session secret also invalidates previously generated activity links.
  const publicId = (id: string) =>
    createHmac('sha256', settings.secret).update(id).digest('hex');
  const publicActivity = ({ source, id, ...item }: Activity) => ({
    ...item,
    id: publicId(id),
  });
  app.get('/api/admin/status', requireSession, async (req, res) => {
    const user = sessionUser(req.cookies.scele_session)!;
    if ((await roleFor(user.username)) !== 'admin') {
      res.status(403).json({ error: 'Administrator access required.' });
      return;
    }
    try {
      const data = await tracker.get();
      res.json({
        sources: data.sources,
        configured: data.configured,
        checkedAt: data.checkedAt,
      });
    } catch {
      res.status(503).json({ error: 'Check the private tracker configuration.' });
    }
  });
  // The shared account cache remains available for explicitly authorized
  // diagnostics, never as a fallback in a visitor's personalized response.
  app.get('/api/admin/shared-activities', requireSession, async (req, res) => {
    const user = sessionUser(req.cookies.scele_session)!;
    if ((await roleFor(user.username)) !== 'admin') {
      res.status(403).json({ error: 'Administrator access required.' });
      return;
    }
    try {
      const data = await tracker.get();
      res.json({
        activities: data.activities.map(publicActivity),
        sources: data.sources,
        configured: data.configured,
        checkedAt: data.checkedAt,
        stale: data.stale,
        preparing: data.preparing,
      });
    } catch {
      res.status(503).json({ error: 'Shared activity snapshot unavailable.' });
    }
  });
  app.use('/api/activities', requireSession);
  app.get('/api/activities', async (req, res) => {
    try {
      const data = await getPersonal(sessionUser(req.cookies.scele_session)!.username);
      res.json({
        activities: data.activities.map(publicActivity),
        incomplete: data.incomplete,
        preparing: data.preparing,
      });
    } catch (error) {
      if (error instanceof MoodleSessionExpired) {
        clearUserMoodleSession(sessionUser(req.cookies.scele_session)!.username);
        res
          .status(401)
          .json({ error: 'Your SCELE session expired. Sign in again to reconnect.' });
        return;
      }
      res.status(503).json({
        error: 'Course information is temporarily unavailable. Please try again later.',
      });
    }
  });
  app.get('/api/activities/:id', async (req, res) => {
    try {
      const data = await getPersonal(sessionUser(req.cookies.scele_session)!.username);
      const item = data.activities.find(
        (activity) => publicId(activity.id) === req.params.id,
      );
      if (!item) {
        res.status(404).json({ error: 'Activity not found or no longer accessible.' });
        return;
      }
      res.json({ activity: publicActivity(item) });
    } catch (error) {
      if (error instanceof MoodleSessionExpired) {
        clearUserMoodleSession(sessionUser(req.cookies.scele_session)!.username);
        res
          .status(401)
          .json({ error: 'Your SCELE session expired. Sign in again to reconnect.' });
        return;
      }
      res.status(503).json({ error: 'Tracker temporarily unavailable.' });
    }
  });

  // Room schedules backed by persistent SQLite cache (scheduled refresh every 3 days)
  app.get('/api/rooms/schedule', async (_req, res) => {
    try {
      const data = await roomTracker.getSchedule();
      res.json(data);
    } catch (err) {
      res
        .status(502)
        .json({ error: (err as Error).message || 'Unable to fetch room schedules.' });
    }
  });

  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));
  return app;
}
