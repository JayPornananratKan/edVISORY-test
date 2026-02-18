import { FastifyInstance, FastifyReply } from 'fastify';
import { Account } from '../entities/Account';
import { AppDataSource } from '../config/database';
import { I18nUtils } from '../utils/i18n';
import { ApiResponse, AuthenticatedRequest } from '../types';

interface CreateAccountBody {
  name: string;
  account_type: 'cash' | 'bank_account' | 'credit_card' | 'digital_wallet';
  bank_name?: string;
  account_number?: string;
  initial_balance: number;
  currency: string;
}

interface UpdateAccountBody {
  name?: string;
  current_balance?: number;
  is_active?: boolean;
}

export class AccountController {
  private accountRepository = AppDataSource.getRepository(Account);

  async getAccounts(authedRequest: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const page = parseInt((authedRequest.query as any).page) || 1;
      const limit = parseInt((authedRequest.query as any).limit) || 20;
      const skip = (page - 1) * limit;

      const [accounts, total] = await this.accountRepository.findAndCount({
        where: { user_id: authedRequest.user.id },
        skip,
        take: limit,
        order: { created_at: 'DESC' }
      });

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

  async createAccount(authedRequest: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { name, account_type, bank_name, account_number, initial_balance, currency } = authedRequest.body as CreateAccountBody;

      const account = this.accountRepository.create({
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

      await this.accountRepository.save(account);

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
          created_at: account.created_at,
          updated_at: account.updated_at
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

  async getAccountById(authedRequest: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { id } = authedRequest.params as { id: string };

      const account = await this.accountRepository.findOne({
        where: { id: parseInt(id), user_id: authedRequest.user.id }
      });

      if (!account) {
        const response: ApiResponse = {
          success: false,
          message: I18nUtils.translate('account.not_found', authedRequest.user.language)
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
      authedRequest.log.error(error);
      const response: ApiResponse = {
        success: false,
        message: I18nUtils.translate('general.server_error', authedRequest.user.language),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      return reply.code(500).send(response);
    }
  }

  async updateAccount(authedRequest: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { id } = authedRequest.params as { id: string };
      const updates = authedRequest.body as UpdateAccountBody;

      const account = await this.accountRepository.findOne({
        where: { id: parseInt(id), user_id: authedRequest.user.id }
      });

      if (!account) {
        const response: ApiResponse = {
          success: false,
          message: I18nUtils.translate('account.not_found', authedRequest.user.language)
        };
        return reply.code(404).send(response);
      }

      // Update account fields
      if (updates.name) account.name = updates.name;
      if (updates.current_balance !== undefined) account.current_balance = updates.current_balance;
      if (updates.is_active !== undefined) account.is_active = updates.is_active;

      await this.accountRepository.save(account);

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
      authedRequest.log.error(error);
      const response: ApiResponse = {
        success: false,
        message: I18nUtils.translate('general.server_error', authedRequest.user.language),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      return reply.code(500).send(response);
    }
  }

  async deleteAccount(authedRequest: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { id } = authedRequest.params as { id: string };

      const account = await this.accountRepository.findOne({
        where: { id: parseInt(id), user_id: authedRequest.user.id }
      });

      if (!account) {
        const response: ApiResponse = {
          success: false,
          message: I18nUtils.translate('account.not_found', authedRequest.user.language)
        };
        return reply.code(404).send(response);
      }

      // Soft delete
      account.is_active = false;
      await this.accountRepository.save(account);

      const response: ApiResponse = {
        success: true,
        message: I18nUtils.translate('account.deleted', authedRequest.user.language)
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
