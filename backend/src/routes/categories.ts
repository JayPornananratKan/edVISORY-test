import { FastifyInstance } from 'fastify';
import { CategoryController } from '../controllers/CategoryController';
import { authMiddleware } from '../middleware/auth';

const categoryController = new CategoryController();

export async function categoryRoutes(fastify: FastifyInstance) {
  // Create new category
  fastify.post('/categories', {
    preHandler: authMiddleware
  }, async (request, reply) => {
    return categoryController.createCategory(request as any, reply);
  });

  // Get all categories for user
  fastify.get('/categories', {
    preHandler: authMiddleware
  }, async (request, reply) => {
    return categoryController.getCategories(request as any, reply);
  });

  // Get category by ID
  fastify.get('/categories/:id', {
    preHandler: authMiddleware
  }, async (request, reply) => {
    return categoryController.getCategoryById(request as any, reply);
  });

  // Update category
  fastify.put('/categories/:id', {
    preHandler: authMiddleware
  }, async (request, reply) => {
    return categoryController.updateCategory(request as any, reply);
  });

  // Delete category
  fastify.delete('/categories/:id', {
    preHandler: authMiddleware
  }, async (request, reply) => {
    return categoryController.deleteCategory(request as any, reply);
  });
}
