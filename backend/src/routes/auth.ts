import { FastifyInstance } from 'fastify';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware } from '../middleware/auth';
import { validate, ValidationConfig } from '../middleware/validation';

const authController = new AuthController();

export async function authRoutes(fastify: FastifyInstance) {
  // Public routes
  fastify.post('/register', {
    preHandler: validate('register', ValidationConfig.register)
  }, async (request, reply) => {
    return authController.register(request as any, reply);
  });
  
  fastify.post('/login', {
    preHandler: validate('login', ValidationConfig.login)
  }, async (request, reply) => {
    return authController.login(request as any, reply);
  });

  // Protected routes
  fastify.post('/logout', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return authController.logout(request as any, reply);
  });

  fastify.post('/logout-all', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return authController.logoutAll(request as any, reply);
  });

  fastify.get('/profile', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    return authController.getProfile(request as any, reply);
  });
}
