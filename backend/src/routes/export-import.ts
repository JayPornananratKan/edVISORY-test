import { FastifyInstance } from 'fastify';
import { ExportImportController } from '../controllers/ExportImportController';
import { authMiddleware } from '../middleware/auth';

const exportImportController = new ExportImportController();

export async function exportImportRoutes(fastify: FastifyInstance) {
  // Export transactions
  fastify.get('/export', {
    preHandler: authMiddleware
  }, async (request, reply) => {
    return exportImportController.exportTransactions(request as any, reply);
  });

  // Import transactions
  fastify.post('/import', {
    preHandler: authMiddleware
  }, async (request, reply) => {
    return exportImportController.importTransactions(request as any, reply);
  });

  // Get import template
  fastify.get('/template', {
    preHandler: authMiddleware
  }, async (request, reply) => {
    return exportImportController.getImportTemplate(request as any, reply);
  });

  // Get supported formats
  fastify.get('/formats', {
    preHandler: authMiddleware
  }, async (request, reply) => {
    return exportImportController.getSupportedFormats(request as any, reply);
  });
}
