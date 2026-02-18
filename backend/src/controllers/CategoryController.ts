import { FastifyInstance, FastifyReply } from 'fastify';
import { Category } from '../entities/Category';
import { AppDataSource } from '../config/database';
import { I18nUtils } from '../utils/i18n';
import { ApiResponse, AuthenticatedRequest } from '../types';

interface CreateCategoryBody {
  name: string;
  description?: string;
  color: string;
  icon: string;
  is_expense: boolean;
  parent_id?: number;
}

interface UpdateCategoryBody {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  is_active?: boolean;
}

export class CategoryController {
  private categoryRepository = AppDataSource.getRepository(Category);

  async getCategories(authedRequest: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const page = parseInt((authedRequest.query as any).page) || 1;
      const limit = parseInt((authedRequest.query as any).limit) || 50;
      const isExpense = (authedRequest.query as any).is_expense;
      const skip = (page - 1) * limit;

      let whereCondition: any = { user_id: authedRequest.user.id };
      if (isExpense !== undefined) {
        whereCondition.is_expense = isExpense === 'true';
      }

      const [categories, total] = await this.categoryRepository.findAndCount({
        where: whereCondition,
        skip,
        take: limit,
        order: { created_at: 'DESC' }
      });

      const response: ApiResponse = {
        success: true,
        data: categories.map(category => ({
          id: category.id,
          name: category.name,
          description: category.description,
          color: category.color,
          icon: category.icon,
          is_expense: category.is_expense,
          parent_id: category.parent_id,
          is_active: category.is_active,
          created_at: category.created_at,
          updated_at: category.updated_at
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };

      return reply.send(response);

    } catch (error) {
      authedRequest.log.error(error);
      const response: ApiResponse = {
        success: false,
        message: I18nUtils.translate('general.server_error', authedRequest.user.language),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      return reply.code(500).send(response);
    }
  }

  async createCategory(authedRequest: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { name, description, color, icon, is_expense, parent_id } = authedRequest.body as CreateCategoryBody;

      // Check for circular reference if parent_id is provided
      if (parent_id) {
        const parentCategory = await this.categoryRepository.findOne({
          where: { id: parent_id, user_id: authedRequest.user.id }
        });

        if (!parentCategory) {
          const response: ApiResponse = {
            success: false,
            message: I18nUtils.translate('category.parent_not_found', authedRequest.user.language)
          };
          return reply.code(404).send(response);
        }

        // Check if parent is expense and child is income or vice versa
        if (parentCategory.is_expense !== is_expense) {
          const response: ApiResponse = {
            success: false,
            message: I18nUtils.translate('category.type_mismatch', authedRequest.user.language)
          };
          return reply.code(400).send(response);
        }
      }

      const category = this.categoryRepository.create({
        user_id: authedRequest.user.id,
        name,
        description,
        color,
        icon,
        is_expense,
        parent_id,
        is_active: true
      });

      await this.categoryRepository.save(category);

      const response: ApiResponse = {
        success: true,
        message: I18nUtils.translate('category.created', authedRequest.user.language),
        data: {
          id: category.id,
          name: category.name,
          description: category.description,
          color: category.color,
          icon: category.icon,
          is_expense: category.is_expense,
          parent_id: category.parent_id,
          is_active: category.is_active,
          created_at: category.created_at,
          updated_at: category.updated_at
        }
      };

      return reply.code(201).send(response);

    } catch (error) {
      authedRequest.log.error(error);
      const response: ApiResponse = {
        success: false,
        message: I18nUtils.translate('general.server_error', authedRequest.user.language),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      return reply.code(500).send(response);
    }
  }

  async getCategoryById(authedRequest: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { id } = authedRequest.params as { id: string };

      const category = await this.categoryRepository.findOne({
        where: { id: parseInt(id), user_id: authedRequest.user.id }
      });

      if (!category) {
        const response: ApiResponse = {
          success: false,
          message: I18nUtils.translate('category.not_found', authedRequest.user.language)
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
          is_expense: category.is_expense,
          parent_id: category.parent_id,
          is_active: category.is_active,
          created_at: category.created_at,
          updated_at: category.updated_at
        }
      };

      return reply.send(response);

    } catch (error) {
      authedRequest.log.error(error);
      const response: ApiResponse = {
        success: false,
        message: I18nUtils.translate('general.server_error', authedRequest.user.language),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      return reply.code(500).send(response);
    }
  }

  async updateCategory(authedRequest: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { id } = authedRequest.params as { id: string };
      const updates = authedRequest.body as UpdateCategoryBody;

      const category = await this.categoryRepository.findOne({
        where: { id: parseInt(id), user_id: authedRequest.user.id }
      });

      if (!category) {
        const response: ApiResponse = {
          success: false,
          message: I18nUtils.translate('category.not_found', authedRequest.user.language)
        };
        return reply.code(404).send(response);
      }

      // Update category fields
      if (updates.name) category.name = updates.name;
      if (updates.description) category.description = updates.description;
      if (updates.color) category.color = updates.color;
      if (updates.icon) category.icon = updates.icon;
      if (updates.is_active !== undefined) category.is_active = updates.is_active;

      await this.categoryRepository.save(category);

      const response: ApiResponse = {
        success: true,
        message: I18nUtils.translate('category.updated', authedRequest.user.language),
        data: {
          id: category.id,
          name: category.name,
          description: category.description,
          color: category.color,
          icon: category.icon,
          is_expense: category.is_expense,
          parent_id: category.parent_id,
          is_active: category.is_active,
          created_at: category.created_at,
          updated_at: category.updated_at
        }
      };

      return reply.send(response);

    } catch (error) {
      authedRequest.log.error(error);
      const response: ApiResponse = {
        success: false,
        message: I18nUtils.translate('general.server_error', authedRequest.user.language),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      return reply.code(500).send(response);
    }
  }

  async deleteCategory(authedRequest: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { id } = authedRequest.params as { id: string };

      const category = await this.categoryRepository.findOne({
        where: { id: parseInt(id), user_id: authedRequest.user.id }
      });

      if (!category) {
        const response: ApiResponse = {
          success: false,
          message: I18nUtils.translate('category.not_found', authedRequest.user.language)
        };
        return reply.code(404).send(response);
      }

      // Check if category has children
      const hasChildren = await this.categoryRepository.findOne({
        where: { parent_id: category.id }
      });

      if (hasChildren) {
        const response: ApiResponse = {
          success: false,
          message: I18nUtils.translate('category.has_children', authedRequest.user.language)
        };
        return reply.code(400).send(response);
      }

      // Soft delete
      category.is_active = false;
      await this.categoryRepository.save(category);

      const response: ApiResponse = {
        success: true,
        message: I18nUtils.translate('category.deleted', authedRequest.user.language)
      };

      return reply.send(response);

    } catch (error) {
      authedRequest.log.error(error);
      const response: ApiResponse = {
        success: false,
        message: I18nUtils.translate('general.server_error', authedRequest.user.language),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      return reply.code(500).send(response);
    }
  }
}
