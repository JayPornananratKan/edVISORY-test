import { FastifyInstance, FastifyReply } from 'fastify';
import { CategoryService } from '../services/CategoryService';
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
  private categoryService = new CategoryService();

  async getCategories(authedRequest: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const page = parseInt((authedRequest.query as any).page) || 1;
      const limit = parseInt((authedRequest.query as any).limit) || 50;

      const result = await this.categoryService.getCategories(authedRequest.user.id, page, limit);

      const response: ApiResponse = {
        success: true,
        data: result.categories,
        pagination: result.pagination
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

  async getCategoryById(authedRequest: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const categoryId = parseInt((authedRequest.params as any).id);
      const category = await this.categoryService.getCategoryById(categoryId, authedRequest.user.id);

      const response: ApiResponse = {
        success: true,
        data: category
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
      const categoryData: CreateCategoryBody = authedRequest.body as any;
      const category = await this.categoryService.createCategory({
        ...categoryData,
        userId: authedRequest.user.id
      });

      const response: ApiResponse = {
        success: true,
        message: I18nUtils.translate('category.created', authedRequest.user.language),
        data: category
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

  async updateCategory(authedRequest: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const categoryId = parseInt((authedRequest.params as any).id);
      const updateData: UpdateCategoryBody = authedRequest.body as any;

      const category = await this.categoryService.updateCategory(categoryId, authedRequest.user.id, updateData);

      const response: ApiResponse = {
        success: true,
        message: I18nUtils.translate('category.updated', authedRequest.user.language),
        data: category
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
      const categoryId = parseInt((authedRequest.params as any).id);
      await this.categoryService.deleteCategory(categoryId, authedRequest.user.id);

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

  async getCategoryTree(authedRequest: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const result = await this.categoryService.getCategoryTree(authedRequest.user.id);

      const response: ApiResponse = {
        success: true,
        data: result.categories,
        pagination: {
          page: 1,
          limit: result.total_count,
          total: result.total_count,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
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

  async getCategoriesByType(authedRequest: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const is_expense = (authedRequest.params as any).type === 'expense';
      const categories = await this.categoryService.getCategoriesByType(authedRequest.user.id, is_expense);

      const response: ApiResponse = {
        success: true,
        data: categories
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
