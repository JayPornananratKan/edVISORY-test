import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Category } from '../entities/Category';
import { AppDataSource } from '../config/database';
import { ApiResponse, AuthenticatedRequest } from '../types';
import { authMiddleware } from '../middleware/auth';
import { I18nUtils } from '../utils/i18n';

interface CreateCategoryBody {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parent_id?: number;
  is_expense?: boolean;
}

interface UpdateCategoryBody {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  parent_id?: number;
  is_expense?: boolean;
  is_active?: boolean;
}

interface CategoryQuery {
  page?: number;
  limit?: number;
  search?: string;
  is_expense?: boolean;
  is_active?: boolean;
  parent_id?: number;
}

export async function categoryRoutes(fastify: FastifyInstance) {
  const categoryRepository = AppDataSource.getRepository(Category);

  // Create new category
  fastify.post<{ Body: CreateCategoryBody }>('/categories', {
    preHandler: authMiddleware
  }, async (request: FastifyRequest<{ Body: CreateCategoryBody }>, reply: FastifyReply) => {
    const authedRequest = request as AuthenticatedRequest;
    try {
      const { name, description, color, icon, parent_id, is_expense = true } = request.body;

      // Check if category with same name already exists for this user
      const existingCategory = await categoryRepository.findOne({
        where: { 
          name, 
          user_id: authedRequest.user.id,
          is_active: true 
        }
      });

      if (existingCategory) {
        const response: ApiResponse = {
          success: false,
          message: I18nUtils.translate('category.name_required', authedRequest.user.language),
          error: 'Category with this name already exists'
        };
        return reply.code(409).send(response);
      }

      // Check if parent exists and belongs to user
      if (parent_id) {
        const parentCategory = await categoryRepository.findOne({
          where: { id: parent_id, user_id: authedRequest.user.id }
        });

        if (!parentCategory) {
          const response: ApiResponse = {
            success: false,
            message: I18nUtils.translate('category.parent_not_found', authedRequest.user.language),
            error: 'Parent category not found'
          };
          return reply.code(404).send(response);
        }
      }

      // Create new category
      const category = categoryRepository.create({
        user_id: authedRequest.user.id,
        name,
        description,
        color,
        icon,
        parent_id,
        is_expense,
        is_active: true
      });

      await categoryRepository.save(category);

      const response: ApiResponse = {
        success: true,
        message: I18nUtils.translate('category.created', authedRequest.user.language),
        data: {
          id: category.id,
          name: category.name,
          description: category.description,
          color: category.color,
          icon: category.icon,
          parent_id: category.parent_id,
          is_expense: category.is_expense,
          is_active: category.is_active,
          created_at: category.created_at
        }
      };

      return reply.code(201).send(response);

    } catch (error) {
      fastify.log.error(error);
      const response: ApiResponse = {
        success: false,
        message: I18nUtils.translate('general.server_error', authedRequest.user.language),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      return reply.code(500).send(response);
    }
  });

  // Get all categories for authenticated user
  fastify.get<{ Querystring: CategoryQuery }>('/categories', {
    preHandler: authMiddleware
  }, async (request: FastifyRequest<{ Querystring: CategoryQuery }>, reply: FastifyReply) => {
    const authedRequest = request as AuthenticatedRequest;
    try {
      const { page = 1, limit = 50, search, is_expense, is_active = true, parent_id } = request.query;

      // Build query
      const queryBuilder = categoryRepository
        .createQueryBuilder('category')
        .where('category.user_id = :userId', { userId: authedRequest.user.id });

      // Add filters
      if (search) {
        queryBuilder.andWhere(
          '(category.name ILIKE :search OR category.description ILIKE :search)',
          { search: `%${search}%` }
        );
      }

      if (is_expense !== undefined) {
        queryBuilder.andWhere('category.is_expense = :is_expense', { is_expense });
      }

      if (is_active !== undefined) {
        queryBuilder.andWhere('category.is_active = :is_active', { is_active });
      }

      if (parent_id !== undefined) {
        queryBuilder.andWhere('category.parent_id = :parent_id', { parent_id });
      } else {
        // By default, get root categories (parent_id is null)
        queryBuilder.andWhere('category.parent_id IS NULL');
      }

      // Add pagination
      const skip = (page - 1) * limit;
      queryBuilder.skip(skip).take(limit);
      queryBuilder.orderBy('category.name', 'ASC');

      const [categories, total] = await queryBuilder.getManyAndCount();

      const totalPages = Math.ceil(total / limit);

      const response: ApiResponse = {
        success: true,
        data: categories.map(category => ({
          id: category.id,
          name: category.name,
          description: category.description,
          color: category.color,
          icon: category.icon,
          parent_id: category.parent_id,
          is_expense: category.is_expense,
          is_active: category.is_active,
          created_at: category.created_at,
          updated_at: category.updated_at
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };

      return reply.send(response);

    } catch (error) {
      fastify.log.error(error);
      const response: ApiResponse = {
        success: false,
        message: I18nUtils.translate('general.server_error', authedRequest.user.language),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      return reply.code(500).send(response);
    }
  });

  // Get single category
  fastify.get<{ Params: { id: string } }>('/categories/:id', {
    preHandler: authMiddleware
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const authedRequest = request as AuthenticatedRequest;
    try {
      const categoryId = parseInt(request.params.id);

      if (isNaN(categoryId)) {
        const response: ApiResponse = {
          success: false,
          message: I18nUtils.translate('general.invalid_request', authedRequest.user.language),
          error: 'Invalid category ID'
        };
        return reply.code(400).send(response);
      }

      const category = await categoryRepository.findOne({
        where: { id: categoryId, user_id: authedRequest.user.id }
      });

      if (!category) {
        const response: ApiResponse = {
          success: false,
          message: I18nUtils.translate('category.not_found', authedRequest.user.language),
          error: 'Category not found'
        };
        return reply.code(404).send(response);
      }

      const response: ApiResponse = {
        success: true,
        data: {
          id: category.id,
          name: category.name,
          description: category.description,
          color: category.color,
          icon: category.icon,
          parent_id: category.parent_id,
          is_expense: category.is_expense,
          is_active: category.is_active,
          created_at: category.created_at,
          updated_at: category.updated_at
        }
      };

      return reply.send(response);

    } catch (error) {
      fastify.log.error(error);
      const response: ApiResponse = {
        success: false,
        message: I18nUtils.translate('general.server_error', authedRequest.user.language),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      return reply.code(500).send(response);
    }
  });

  // Update category
  fastify.patch<{ Params: { id: string }; Body: UpdateCategoryBody }>('/categories/:id', {
    preHandler: authMiddleware
  }, async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateCategoryBody }>, reply: FastifyReply) => {
    const authedRequest = request as AuthenticatedRequest;
    try {
      const categoryId = parseInt(request.params.id);

      if (isNaN(categoryId)) {
        const response: ApiResponse = {
          success: false,
          message: I18nUtils.translate('general.invalid_request', authedRequest.user.language),
          error: 'Invalid category ID'
        };
        return reply.code(400).send(response);
      }

      const category = await categoryRepository.findOne({
        where: { id: categoryId, user_id: authedRequest.user.id }
      });

      if (!category) {
        const response: ApiResponse = {
          success: false,
          message: I18nUtils.translate('category.not_found', authedRequest.user.language),
          error: 'Category not found'
        };
        return reply.code(404).send(response);
      }

      // Check for circular reference if parent_id is being updated
      const updates = request.body;
      if (updates.parent_id !== undefined && updates.parent_id !== null) {
        if (updates.parent_id === categoryId) {
          const response: ApiResponse = {
            success: false,
            message: I18nUtils.translate('category.circular_reference', authedRequest.user.language),
            error: 'Category cannot be its own parent'
          };
          return reply.code(400).send(response);
        }

        const parentCategory = await categoryRepository.findOne({
          where: { id: updates.parent_id, user_id: authedRequest.user.id }
        });

        if (!parentCategory) {
          const response: ApiResponse = {
            success: false,
            message: I18nUtils.translate('category.parent_not_found', authedRequest.user.language),
            error: 'Parent category not found'
          };
          return reply.code(404).send(response);
        }
      }

      // Update category fields
      Object.assign(category, updates);

      await categoryRepository.save(category);

      const response: ApiResponse = {
        success: true,
        message: I18nUtils.translate('category.updated', authedRequest.user.language),
        data: {
          id: category.id,
          name: category.name,
          description: category.description,
          color: category.color,
          icon: category.icon,
          parent_id: category.parent_id,
          is_expense: category.is_expense,
          is_active: category.is_active,
          created_at: category.created_at,
          updated_at: category.updated_at
        }
      };

      return reply.send(response);

    } catch (error) {
      fastify.log.error(error);
      const response: ApiResponse = {
        success: false,
        message: I18nUtils.translate('general.server_error', authedRequest.user.language),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      return reply.code(500).send(response);
    }
  });

  // Delete category (soft delete by setting is_active to false)
  fastify.delete<{ Params: { id: string } }>('/categories/:id', {
    preHandler: authMiddleware
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const authedRequest = request as AuthenticatedRequest;
    try {
      const categoryId = parseInt(request.params.id);

      if (isNaN(categoryId)) {
        const response: ApiResponse = {
          success: false,
          message: I18nUtils.translate('general.invalid_request', authedRequest.user.language),
          error: 'Invalid category ID'
        };
        return reply.code(400).send(response);
      }

      const category = await categoryRepository.findOne({
        where: { id: categoryId, user_id: authedRequest.user.id }
      });

      if (!category) {
        const response: ApiResponse = {
          success: false,
          message: I18nUtils.translate('category.not_found', authedRequest.user.language),
          error: 'Category not found'
        };
        return reply.code(404).send(response);
      }

      // Check if category has child categories
      const childCategories = await categoryRepository.find({
        where: { parent_id: categoryId, is_active: true }
      });

      if (childCategories.length > 0) {
        const response: ApiResponse = {
          success: false,
          message: I18nUtils.translate('category.has_transactions', authedRequest.user.language),
          error: 'Cannot delete category with child categories'
        };
        return reply.code(400).send(response);
      }

      // Check if category has transactions (this would be implemented with transaction repository)
      // For now, we'll allow deletion but in production you'd want to check dependencies

      category.is_active = false;
      await categoryRepository.save(category);

      const response: ApiResponse = {
        success: true,
        message: I18nUtils.translate('category.deleted', authedRequest.user.language)
      };

      return reply.send(response);

    } catch (error) {
      fastify.log.error(error);
      const response: ApiResponse = {
        success: false,
        message: I18nUtils.translate('general.server_error', authedRequest.user.language),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      return reply.code(500).send(response);
    }
  });
}
