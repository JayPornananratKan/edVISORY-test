import { FastifyInstance } from 'fastify';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware } from '../middleware/auth';

const authController = new AuthController();

export async function authRoutes(fastify: FastifyInstance) {
  // Public routes
  fastify.post('/register', async (request, reply) => {
    return authController.register(request as any, reply);
  });
  
  fastify.post('/login', async (request, reply) => {
    return authController.login(request as any, reply);
  });

  // Protected routes
  fastify.post('/logout', {
    preHandler: authMiddleware
  }, async (request, reply) => {
    return authController.logout(request as any, reply);
  });

  fastify.post('/logout-all', {
    preHandler: authMiddleware
  }, async (request, reply) => {
    return authController.logoutAll(request as any, reply);
  });

  fastify.get('/profile', {
    preHandler: authMiddleware
  }, async (request, reply) => {
    return authController.getProfile(request as any, reply);
  });
}
