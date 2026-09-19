import { createHmac } from 'node:crypto';
import { settings } from './tracker/config.js';
import { roleFor } from './tracker/roles.js';
import type { Activity } from './tracker/types.js';
import express from 'express';
import cookieParser from 'cookie-parser';
import { auth, requireSession, sessionUser } from './tracker/auth.js';
import { createTracker } from './tracker/store.js';

export function createApp(tracker = createTracker()) {
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
  const publicId = (id: string) => createHmac('sha256', settings.secret).update(id).digest('hex');
  const publicActivity = ({ source, id, ...item }: Activity) => ({ ...item, id: publicId(id) });
  app.get('/api/admin/status', requireSession, async (req, res) => {
    const user = sessionUser(req.cookies.scele_session)!;
    if (await roleFor(user.username) !== 'admin') { res.status(403).json({ error: 'Administrator access required.' }); return; }
    try {
      const data = await tracker.get();
      res.json({ sources: data.sources, configured: data.configured, checkedAt: data.checkedAt });
    } catch { res.status(503).json({ error: 'Check the private tracker configuration.' }); }
  });
  app.use('/api/activities', requireSession);
  app.get('/api/activities', async (_req, res) => {
    try {
      const data = await tracker.get();
      res.json({ activities: data.activities.map(publicActivity), incomplete: !data.configured || data.sources.some(source => source.state !== 'ok') });
    }
    catch { res.status(503).json({ error: 'Course information is temporarily unavailable. Please try again later.' }); }
  });
  app.get('/api/activities/:id', async (req, res) => {
    try {
      const data = await tracker.get();
      const item = data.activities.find(activity => publicId(activity.id) === req.params.id);
      if (!item) { res.status(404).json({ error: 'Activity not found or no longer accessible.' }); return; }
      res.json({ activity: publicActivity(item) });
    } catch { res.status(503).json({ error: 'Tracker temporarily unavailable.' }); }
  });
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));
  return app;
}
