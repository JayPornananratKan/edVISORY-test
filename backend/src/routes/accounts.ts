import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Account } from '../entities/Account';
import { AppDataSource } from '../config/database';
import { ApiResponse, AuthenticatedRequest } from '../types';
import { authMiddleware } from '../middleware/auth';
import { I18nUtils } from '../utils/i18n';

interface CreateAccountBody {
  name: string;
  account_type: string;
  bank_name?: string;
  account_number?: string;
  initial_balance?: number;
  currency?: string;
}

interface UpdateAccountBody {
  name?: string;
  account_type?: string;
  bank_name?: string;
  account_number?: string;
  currency?: string;
  is_active?: boolean;
}

interface AccountQuery {
  page?: number;
  limit?: number;
  search?: string;
  account_type?: string;
  is_active?: boolean;
}

export async function accountRoutes(fastify: FastifyInstance) {
  const accountRepository = AppDataSource.getRepository(Account);

  // Create new account
  fastify.post<{ Body: CreateAccountBody }>('/accounts', {
    preHandler: authMiddleware
  }, async (request: FastifyRequest<{ Body: CreateAccountBody }>, reply: FastifyReply) => {
    const authedRequest = request as AuthenticatedRequest;
    try {
      const { name, account_type, bank_name, account_number, initial_balance = 0, currency = 'THB' } = request.body;

      // Create new account
      const account = accountRepository.create({
        user_id: authedRequest.user.id,
        name,
        account_type,
        bank_name,
        account_number,
        initial_balance,
        current_balance: initial_balance,
        currency,
        is_active: true
      });

      await accountRepository.save(account);

      const response: ApiResponse = {
        success: true,
        message: I18nUtils.translate('account.created', authedRequest.user.language),
        data: {
          id: account.id,
          name: account.name,
          account_type: account.account_type,
          bank_name: account.bank_name,
          account_number: account.account_number,
          initial_balance: account.initial_balance,
          current_balance: account.current_balance,
          currency: account.currency,
          is_active: account.is_active,
          created_at: account.created_at
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

  // Get all accounts for authenticated user
  fastify.get<{ Querystring: AccountQuery }>('/accounts', {
    preHandler: authMiddleware
  }, async (request: FastifyRequest<{ Querystring: AccountQuery }>, reply: FastifyReply) => {
    const authedRequest = request as AuthenticatedRequest;
    try {
      const { page = 1, limit = 20, search, account_type, is_active } = request.query;

      // Build query
      const queryBuilder = accountRepository
        .createQueryBuilder('account')
        .where('account.user_id = :userId', { userId: authedRequest.user.id });

      // Add filters
      if (search) {
        queryBuilder.andWhere(
          '(account.name ILIKE :search OR account.bank_name ILIKE :search OR account.account_number ILIKE :search)',
          { search: `%${search}%` }
        );
      }

      if (account_type) {
        queryBuilder.andWhere('account.account_type = :account_type', { account_type });
      }

      if (is_active !== undefined) {
        queryBuilder.andWhere('account.is_active = :is_active', { is_active });
      }

      // Add pagination
      const skip = (page - 1) * limit;
      queryBuilder.skip(skip).take(limit);
      queryBuilder.orderBy('account.created_at', 'DESC');

      const [accounts, total] = await queryBuilder.getManyAndCount();

      const totalPages = Math.ceil(total / limit);

      const response: ApiResponse = {
        success: true,
        data: accounts.map(account => ({
          id: account.id,
          name: account.name,
          account_type: account.account_type,
          bank_name: account.bank_name,
          account_number: account.account_number,
          initial_balance: account.initial_balance,
          current_balance: account.current_balance,
          currency: account.currency,
          is_active: account.is_active,
          created_at: account.created_at,
          updated_at: account.updated_at
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

  // Get single account
  fastify.get<{ Params: { id: string } }>('/accounts/:id', {
    preHandler: authMiddleware
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const authedRequest = request as AuthenticatedRequest;
    try {
      const accountId = parseInt(request.params.id);

      if (isNaN(accountId)) {
        const response: ApiResponse = {
          success: false,
          message: I18nUtils.translate('general.invalid_request', authedRequest.user.language),
          error: 'Invalid account ID'
        };
        return reply.code(400).send(response);
      }

      const account = await accountRepository.findOne({
        where: { id: accountId, user_id: authedRequest.user.id }
      });

      if (!account) {
        const response: ApiResponse = {
          success: false,
          message: I18nUtils.translate('account.not_found', authedRequest.user.language),
          error: 'Account not found'
        };
        return reply.code(404).send(response);
      }

      const response: ApiResponse = {
        success: true,
        data: {
          id: account.id,
          name: account.name,
          account_type: account.account_type,
          bank_name: account.bank_name,
          account_number: account.account_number,
          initial_balance: account.initial_balance,
          current_balance: account.current_balance,
          currency: account.currency,
          is_active: account.is_active,
          created_at: account.created_at,
          updated_at: account.updated_at
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

  // Update account
  fastify.patch<{ Params: { id: string }; Body: UpdateAccountBody }>('/accounts/:id', {
    preHandler: authMiddleware
  }, async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateAccountBody }>, reply: FastifyReply) => {
    const authedRequest = request as AuthenticatedRequest;
    try {
      const accountId = parseInt(request.params.id);

      if (isNaN(accountId)) {
        const response: ApiResponse = {
          success: false,
          message: I18nUtils.translate('general.invalid_request', authedRequest.user.language),
          error: 'Invalid account ID'
        };
        return reply.code(400).send(response);
      }

      const account = await accountRepository.findOne({
        where: { id: accountId, user_id: authedRequest.user.id }
      });

      if (!account) {
        const response: ApiResponse = {
          success: false,
          message: I18nUtils.translate('account.not_found', authedRequest.user.language),
          error: 'Account not found'
        };
        return reply.code(404).send(response);
      }

      // Update account fields
      const updates = request.body;
      Object.assign(account, updates);

      await accountRepository.save(account);

      const response: ApiResponse = {
        success: true,
        message: I18nUtils.translate('account.updated', authedRequest.user.language),
        data: {
          id: account.id,
          name: account.name,
          account_type: account.account_type,
          bank_name: account.bank_name,
          account_number: account.account_number,
          initial_balance: account.initial_balance,
          current_balance: account.current_balance,
          currency: account.currency,
          is_active: account.is_active,
          created_at: account.created_at,
          updated_at: account.updated_at
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

  // Delete account (soft delete by setting is_active to false)
  fastify.delete<{ Params: { id: string } }>('/accounts/:id', {
    preHandler: authMiddleware
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const authedRequest = request as AuthenticatedRequest;
    try {
      const accountId = parseInt(request.params.id);

      if (isNaN(accountId)) {
        const response: ApiResponse = {
          success: false,
          message: I18nUtils.translate('general.invalid_request', authedRequest.user.language),
          error: 'Invalid account ID'
        };
        return reply.code(400).send(response);
      }

      const account = await accountRepository.findOne({
        where: { id: accountId, user_id: authedRequest.user.id }
      });

      if (!account) {
        const response: ApiResponse = {
          success: false,
          message: I18nUtils.translate('account.not_found', authedRequest.user.language),
          error: 'Account not found'
        };
        return reply.code(404).send(response);
      }

      // Check if account has transactions (this would be implemented with transaction repository)
      // For now, we'll allow deletion but in production you'd want to check dependencies

      account.is_active = false;
      await accountRepository.save(account);

      const response: ApiResponse = {
        success: true,
        message: I18nUtils.translate('account.deleted', authedRequest.user.language)
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
