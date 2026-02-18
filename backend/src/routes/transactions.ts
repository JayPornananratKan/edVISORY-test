import { FastifyInstance } from 'fastify';
import { TransactionController } from '../controllers/TransactionController';
import { authMiddleware } from '../middleware/auth';

const transactionController = new TransactionController();

export async function transactionRoutes(fastify: FastifyInstance) {
  // Create new transaction
  fastify.post('/', {
    preHandler: authMiddleware
  }, async (request, reply) => {
    return transactionController.createTransaction(request as any, reply);
  });

  // Get all transactions for user
  fastify.get('/', {
    preHandler: authMiddleware
  }, async (request, reply) => {
    return transactionController.getTransactions(request as any, reply);
  });

  // Get transaction by ID
  fastify.get('/:id', {
    preHandler: authMiddleware
  }, async (request, reply) => {
    return transactionController.getTransactionById(request as any, reply);
  });

  // Update transaction
  fastify.put('/:id', {
    preHandler: authMiddleware
  }, async (request, reply) => {
    return transactionController.updateTransaction(request as any, reply);
  });

  // Delete transaction
  fastify.delete('/:id', {
    preHandler: authMiddleware
  }, async (request, reply) => {
    return transactionController.deleteTransaction(request as any, reply);
  });
}
