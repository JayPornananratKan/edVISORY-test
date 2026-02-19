import { FastifyInstance } from 'fastify';
import { authRoutes } from './auth';
import { accountRoutes } from './accounts';
import { categoryRoutes } from './categories';
import { transactionRoutes } from './transactions';
import { reportRoutes } from './reports';
import { exportImportRoutes } from './export-import';

export async function registerRoutes(fastify: FastifyInstance) {
  // Health check
  fastify.get('/api/health', async () => {
    return { 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    };
  });

  // Register all routes
  await fastify.register(authRoutes, { prefix: '/api/auth' });
  await fastify.register(accountRoutes, { prefix: '/api/accounts' });
  await fastify.register(categoryRoutes, { prefix: '/api/categories' });
  await fastify.register(transactionRoutes, { prefix: '/api/transactions' });
  await fastify.register(reportRoutes, { prefix: '/api/reports' });
  await fastify.register(exportImportRoutes, { prefix: '/api/data' });
}

export { authRoutes, accountRoutes, categoryRoutes, transactionRoutes, reportRoutes, exportImportRoutes };
