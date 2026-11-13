// src/server.ts
import app from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { prisma } from './config/database';

const PORT = env.PORT || 3000;

async function bootstrap() {
  try {
    // Verify database connection
    await prisma.$connect();
    logger.info('Connected to PostgreSQL via Prisma');

    const server = app.listen(PORT, () => {
      logger.info(`🚀 FlowGuard Backend running on http://localhost:${PORT}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
      logger.info(`Health check: http://localhost:${PORT}/api/v1/health`);
    });

    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Gracefully shutting down...`);
      server.close(async () => {
        await prisma.$disconnect();
        logger.info('Database disconnected. Process exiting.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    logger.error({ err }, 'Failed to bootstrap FlowGuard server');
    process.exit(1);
  }
}

bootstrap();
