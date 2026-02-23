import { FastifyInstance } from 'fastify';
import { CategoryController } from '../controllers/CategoryController';
import { authMiddleware } from '../middleware/auth';
import { validate, ValidationConfig } from '../middleware/validation';

const categoryController = new CategoryController();

export async function categoryRoutes(fastify: FastifyInstance) {
  // Create new category
  fastify.post('/', {
    preHandler: [authMiddleware, validate('createCategory', ValidationConfig.createCategory)]
  }, async (request, reply) => {
    return categoryController.createCategory(request as any, reply);
  });

  // Get all categories for user
  fastify.get('/', {
    preHandler: [authMiddleware, validate('pagination', ValidationConfig.getCategories)]
  }, async (request, reply) => {
    return categoryController.getCategories(request as any, reply);
  });

  // Get category by ID
  fastify.get('/:id', {
    preHandler: [authMiddleware, validate('id', ValidationConfig.getCategory)]
  }, async (request, reply) => {
    return categoryController.getCategoryById(request as any, reply);
  });

  // Update category
  fastify.put('/:id', {
    preHandler: [authMiddleware, validate('updateCategory', ValidationConfig.updateCategory)]
  }, async (request, reply) => {
    return categoryController.updateCategory(request as any, reply);
  });

  // Delete category
  fastify.delete('/:id', {
    preHandler: [authMiddleware, validate('id', ValidationConfig.deleteCategory)]
  }, async (request, reply) => {
    return categoryController.deleteCategory(request as any, reply);
  });
}
