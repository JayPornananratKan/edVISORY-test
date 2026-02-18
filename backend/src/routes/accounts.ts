import { FastifyInstance } from 'fastify';
import { AccountController } from '../controllers/AccountController';
import { authMiddleware } from '../middleware/auth';

const accountController = new AccountController();

export async function accountRoutes(fastify: FastifyInstance) {
  // Create new account
  fastify.post('/', {
    preHandler: authMiddleware
  }, async (request, reply) => {
    return accountController.createAccount(request as any, reply);
  });

  // Get all accounts for user
  fastify.get('/', {
    preHandler: authMiddleware
  }, async (request, reply) => {
    return accountController.getAccounts(request as any, reply);
  });

  // Get account by ID
  fastify.get('/:id', {
    preHandler: authMiddleware
  }, async (request, reply) => {
    return accountController.getAccountById(request as any, reply);
  });

  // Update account
  fastify.put('/:id', {
    preHandler: authMiddleware
  }, async (request, reply) => {
    return accountController.updateAccount(request as any, reply);
  });

  // Delete account
  fastify.delete('/:id', {
    preHandler: authMiddleware
  }, async (request, reply) => {
    return accountController.deleteAccount(request as any, reply);
  });
}
