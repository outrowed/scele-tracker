import './env.js';
import express from 'express';
import { resolve } from 'node:path';
import { createApp } from './app.js';
const port = Number(process.env.PORT || 3001);
const app = createApp();
if (process.env.NODE_ENV === 'production') {
  const dist = resolve(import.meta.dirname, '../../ui/dist');
  app.use(express.static(dist));
  app.get('/{*path}', (_req, res) => res.sendFile(resolve(dist, 'index.html')));
}
app.listen(port, process.env.HOST || '127.0.0.1', () => console.log(JSON.stringify({ event: 'server_started', port })));
