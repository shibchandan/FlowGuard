// src/app.ts
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { logger } from './config/logger';
import { prisma } from './config/database';
import { errorMiddleware } from './middleware/error.middleware';
import { AppError } from './shared/errors/AppError';

// Import route modules
import authRoutes from './modules/auth/auth.routes';
import workflowRoutes from './modules/workflows/workflow.routes';
import requestRoutes from './modules/requests/request.routes';
import executionRoutes from './modules/executions/execution.routes';
import reviewRoutes from './modules/reviews/review.routes';
import auditRoutes from './modules/audit/audit.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import simulatorRoutes from './modules/simulator/simulator.routes';

const app: Express = express();

// Security and utility middleware
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin) return callback(null, true);
      return callback(null, true);
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// HTTP logging in non-test environments
if (process.env.NODE_ENV !== 'test') {
  app.use(
    pinoHttp({
      logger,
      autoLogging: {
        ignore: (req) => req.url === '/api/v1/health',
      },
    }),
  );
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/v1/health', async (_req: Request, res: Response) => {
  let dbStatus = 'CONNECTED';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    dbStatus = 'DISCONNECTED';
  }

  res.status(200).json({
    success: true,
    data: {
      status: 'UP',
      database: dbStatus,
      timestamp: new Date().toISOString(),
    },
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/workflows', workflowRoutes);
app.use('/api/v1/requests', requestRoutes);
app.use('/api/v1/executions', executionRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/audit', auditRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/admin', simulatorRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(404, 'NOT_FOUND', `Route not found: ${req.method} ${req.originalUrl}`));
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorMiddleware);

export default app;
