import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

export async function authRoutes(fastify: FastifyInstance) {
  const authController = new AuthController();

  // Public routes
  fastify.post('/register', authController.register.bind(authController));
  fastify.post('/login', authController.login.bind(authController));

  // Protected routes
  fastify.post('/logout', {
    preHandler: authMiddleware,
    handler: (request: FastifyRequest, reply: FastifyReply) => 
      authController.logout(request as AuthenticatedRequest, reply)
  });

  fastify.post('/logout-all', {
    preHandler: authMiddleware,
    handler: (request: FastifyRequest, reply: FastifyReply) => 
      authController.logoutAll(request as AuthenticatedRequest, reply)
  });

  fastify.get('/profile', {
    preHandler: authMiddleware,
    handler: (request: FastifyRequest, reply: FastifyReply) => 
      authController.getProfile(request as AuthenticatedRequest, reply)
  });
}
