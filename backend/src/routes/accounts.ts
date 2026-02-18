import { FastifyInstance } from 'fastify';
import { AccountController } from '../controllers/AccountController';
import { authMiddleware } from '../middleware/auth';

const accountController = new AccountController();

export async function accountRoutes(fastify: FastifyInstance) {
  // Create new account
  fastify.post('/accounts', {
    preHandler: authMiddleware
  }, async (request, reply) => {
    return accountController.createAccount(request as any, reply);
  });

  // Get all accounts for user
  fastify.get('/accounts', {
    preHandler: authMiddleware
  }, async (request, reply) => {
    return accountController.getAccounts(request as any, reply);
  });

  // Get account by ID
  fastify.get('/accounts/:id', {
    preHandler: authMiddleware
  }, async (request, reply) => {
    return accountController.getAccountById(request as any, reply);
  });

  // Update account
  fastify.put('/accounts/:id', {
    preHandler: authMiddleware
  }, async (request, reply) => {
    return accountController.updateAccount(request as any, reply);
  });

  // Delete account
  fastify.delete('/accounts/:id', {
    preHandler: authMiddleware
  }, async (request, reply) => {
    return accountController.deleteAccount(request as any, reply);
  });
}
