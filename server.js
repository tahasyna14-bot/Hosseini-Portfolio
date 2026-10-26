import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPool, databaseEnabled } from './src/db/pool.js';
import { getProjects, getProjectBySlug, saveContactMessage } from './src/db/repository.js';
import { validateContact } from './src/middleware/validation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 3000);

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      imgSrc: ["'self'", 'data:', 'blob:'],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'self'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  }
}));
app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: false, limit: '20kb' }));

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { ok: false, error: 'درخواست‌های زیادی ثبت شده است. کمی بعد دوباره تلاش کنید.' }
});

app.get('/api/health', async (_req, res) => {
  let db = 'not_configured';
  if (databaseEnabled()) {
    try {
      await getPool().query('SELECT 1');
      db = 'connected';
    } catch {
      db = 'unavailable';
    }
  }
  res.status(db === 'unavailable' ? 503 : 200).json({
    ok: db !== 'unavailable',
    service: 'masoom-portfolio',
    database: db,
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/projects', async (_req, res, next) => {
  try {
    const projects = await getProjects();
    res.json({ ok: true, source: databaseEnabled() ? 'database' : 'local-fallback', data: projects });
  } catch (error) { next(error); }
});

app.get('/api/projects/:slug', async (req, res, next) => {
  try {
    const slug = String(req.params.slug || '');
    if (!/^[a-z0-9-]{1,80}$/.test(slug)) {
      return res.status(400).json({ ok: false, error: 'شناسه پروژه معتبر نیست.' });
    }
    const project = await getProjectBySlug(slug);
    if (!project) return res.status(404).json({ ok: false, error: 'پروژه پیدا نشد.' });
    return res.json({ ok: true, data: project });
  } catch (error) { return next(error); }
});

app.post('/api/contact', contactLimiter, async (req, res, next) => {
  const result = validateContact(req.body);
  if (!result.ok) return res.status(400).json({ ok: false, error: result.error });
  if (!databaseEnabled()) {
    return res.status(503).json({
      ok: false,
      error: 'ذخیره پیام هنوز فعال نشده است. مالک سایت باید دیتابیس PostgreSQL را تنظیم کند یا از ایمیل استفاده کنید.'
    });
  }
  try {
    await saveContactMessage(result.data);
    return res.status(201).json({ ok: true, message: 'پیام شما در سامانه ثبت شد. این پاسخ به معنی ارسال ایمیل نیست.' });
  } catch (error) { return next(error); }
});

app.use(express.static(path.join(__dirname, 'public'), {
  extensions: ['html'],
  maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0
}));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  return res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ ok: false, error: 'مسیر API پیدا نشد.' });
  return res.status(404).send('صفحه پیدا نشد.');
});

app.use((error, _req, res, _next) => {
  // Keep technical details in server logs only.
  console.error(`[${new Date().toISOString()}]`, error?.message || 'Unknown server error');
  if (res.headersSent) return;
  return res.status(500).json({ ok: false, error: 'خطای داخلی سرور رخ داد. کمی بعد دوباره تلاش کنید.' });
});

if (process.env.DATABASE_URL) {
  try {
    await getPool().query('SELECT 1');
    console.log('PostgreSQL connection available.');
  } catch (error) {
    console.error('Database connection check failed:', error.message);
  }
}
app.listen(port, '0.0.0.0', () => {
  console.log(`MASOOM portfolio listening on port ${port}`);
});

export default app;
