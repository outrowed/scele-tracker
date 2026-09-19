import express from 'express';
import cookieParser from 'cookie-parser';
import { auth, requireSession } from './tracker/auth.js';
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
  app.use('/api/activities', requireSession);
  app.get('/api/activities', async (_req, res) => {
    try { res.json(await tracker.get()); }
    catch { res.status(503).json({ error: 'Tracker configuration is unavailable. Ask the operator to check the private accounts file.' }); }
  });
  app.get('/api/activities/:id', async (req, res) => {
    try {
      const data = await tracker.get();
      const item = data.activities.find(activity => activity.id === req.params.id);
      if (!item) { res.status(404).json({ error: 'Activity not found or no longer accessible.' }); return; }
      res.json({ activity: item, checkedAt: data.checkedAt });
    } catch { res.status(503).json({ error: 'Tracker temporarily unavailable.' }); }
  });
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));
  return app;
}
