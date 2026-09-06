import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Route imports
import authRoutes from './modules/auth/auth.routes';
import cowRoutes from './modules/cow/cow.routes';
import healthRoutes from './modules/health/health.routes';
import operationsRoutes from './modules/operations/operations.routes';
import donationRoutes from './modules/donation/donation.routes';
import visitorRoutes from './modules/visitor/visitor.routes';
import financeRoutes from './modules/finance/finance.routes';
import publicRoutes from './modules/public/public.routes';

const app = express();

// ─── Security Middleware ────────────────────────────────
// Set security HTTP headers
app.use(helmet());

// Rate limiting — relaxed for dev and hackathon demos (3,000 requests per 15 min in prod, bypass in dev)
const isDev = env.NODE_ENV === 'development';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 50000 : 3000,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isDev || req.path === '/health' || req.path.startsWith('/public'),
});
app.use('/api', limiter);

// Auth rate limiter (generous in dev, safe in prod)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 100,
  message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' },
  skip: () => isDev,
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// CORS
app.use(cors({
  origin: env.CLIENT_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sanitize request body to prevent NoSQL injection (Express 5 compatible)
app.use((req, _res, next) => {
  const sanitize = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) return obj;
    for (const key of Object.keys(obj)) {
      if (key.startsWith('$')) { delete obj[key]; }
      else if (typeof obj[key] === 'object') { sanitize(obj[key]); }
    }
    return obj;
  };
  if (req.body) sanitize(req.body);
  next();
});

// ─── Request Logger (dev) ───────────────────────────────
if (env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    console.log(`📨 ${req.method} ${req.url}`);
    next();
  });
}

// ─── Health Check ───────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'E-Gowshala API', version: '1.0.0' });
});

// ─── API Routes ─────────────────────────────────────────
// Public routes (no auth required)
app.use('/api/public', publicRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/cows', cowRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/operations', operationsRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/finance', financeRoutes);

// ─── Error Handling ─────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
