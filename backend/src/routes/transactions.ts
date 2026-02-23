import { FastifyInstance } from 'fastify';
import { TransactionController } from '../controllers/TransactionController';
import { authMiddleware } from '../middleware/auth';
import { validate, ValidationConfig } from '../middleware/validation';

const transactionController = new TransactionController();

export async function transactionRoutes(fastify: FastifyInstance) {
  // Create new transaction (supports both JSON and multipart)
  fastify.post('/', {
    preHandler: [authMiddleware, validate('createTransaction', ValidationConfig.createTransaction)]
  }, async (request, reply) => {
    // Check if this is a multipart request (with files)
    const contentType = request.headers['content-type'] || '';
    
    if (contentType.includes('multipart/form-data')) {
      return transactionController.createTransactionWithAttachments(request as any, reply);
    } else {
      return transactionController.createTransaction(request as any, reply);
    }
  });

  // Get all transactions for user
  fastify.get('/', {
    preHandler: [authMiddleware, validate('transactionQuery', ValidationConfig.getTransactions)]
  }, async (request, reply) => {
    return transactionController.getTransactions(request as any, reply);
  });

  // Get transaction by ID
  fastify.get('/:id', {
    preHandler: [authMiddleware, validate('id', ValidationConfig.getTransaction)]
  }, async (request, reply) => {
    return transactionController.getTransactionById(request as any, reply);
  });

  // Update transaction
  fastify.put('/:id', {
    preHandler: [authMiddleware, validate('updateTransaction', ValidationConfig.updateTransaction)]
  }, async (request, reply) => {
    return transactionController.updateTransaction(request as any, reply);
  });

  // Delete transaction
  fastify.delete('/:id', {
    preHandler: [authMiddleware, validate('id', ValidationConfig.deleteTransaction)]
  }, async (request, reply) => {
    return transactionController.deleteTransaction(request as any, reply);
  });
}
