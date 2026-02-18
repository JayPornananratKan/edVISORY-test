import { FastifyInstance } from 'fastify';
import { ReportController } from '../controllers/ReportController';
import { authMiddleware } from '../middleware/auth';

const reportController = new ReportController();

export async function reportRoutes(fastify: FastifyInstance) {
  // Get transaction summary
  fastify.get('/reports/transaction-summary', {
    preHandler: authMiddleware
  }, async (request, reply) => {
    return reportController.getTransactionSummary(request as any, reply);
  });

  // Get daily spending analysis
  fastify.get('/reports/daily-spending', {
    preHandler: authMiddleware
  }, async (request, reply) => {
    return reportController.getDailySpending(request as any, reply);
  });

  // Get account summary
  fastify.get('/reports/account-summary', {
    preHandler: authMiddleware
  }, async (request, reply) => {
    return reportController.getAccountSummary(request as any, reply);
  });

  // Get category spending
  fastify.get('/reports/category-spending', {
    preHandler: authMiddleware
  }, async (request, reply) => {
    return reportController.getCategorySpending(request as any, reply);
  });
}
