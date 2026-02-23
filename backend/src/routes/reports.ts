import { FastifyInstance } from 'fastify';
import { ReportController } from '../controllers/ReportController';
import { authMiddleware } from '../middleware/auth';
import { validate, ValidationConfig } from '../middleware/validation';

const reportController = new ReportController();

export async function reportRoutes(fastify: FastifyInstance) {
  // Get transaction summary
  fastify.get('/transaction-summary', {
    preHandler: [authMiddleware, validate('transactionSummaryQuery', ValidationConfig.transactionSummary)]
  }, async (request, reply) => {
    return reportController.getTransactionSummary(request as any, reply);
  });

  // Get daily spending analysis
  fastify.get('/daily-spending', {
    preHandler: [authMiddleware, validate('dailySpendingQuery', ValidationConfig.dailySpending)]
  }, async (request, reply) => {
    return reportController.getDailySpending(request as any, reply);
  });

  // Get account summary
  fastify.get('/account-summary', {
    preHandler: [authMiddleware, validate('accountSummaryQuery', ValidationConfig.accountSummary)]
  }, async (request, reply) => {
    return reportController.getAccountSummary(request as any, reply);
  });

  // Get category spending
  fastify.get('/category-spending', {
    preHandler: [authMiddleware, validate('categorySpendingQuery', ValidationConfig.categorySpending)]
  }, async (request, reply) => {
    return reportController.getCategorySpending(request as any, reply);
  });
}
