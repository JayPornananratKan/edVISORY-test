import { FastifyInstance, FastifyReply } from 'fastify';
import { AccountService } from '../services/AccountService';
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
  private accountService = new AccountService();

  async getAccounts(authedRequest: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const page = parseInt((authedRequest.query as any).page) || 1;
      const limit = parseInt((authedRequest.query as any).limit) || 20;

      const result = await this.accountService.getAccounts(authedRequest.user.id, page, limit);

      const response: ApiResponse = {
        success: true,
        data: result.accounts,
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

  async getAccountById(authedRequest: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const accountId = parseInt((authedRequest.params as any).id);
      const account = await this.accountService.getAccountById(accountId, authedRequest.user.id);

      const response: ApiResponse = {
        success: true,
        data: account
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
      const accountData: CreateAccountBody = authedRequest.body as any;
      const account = await this.accountService.createAccount({
        ...accountData,
        userId: authedRequest.user.id
      });

      const response: ApiResponse = {
        success: true,
        message: I18nUtils.translate('account.created', authedRequest.user.language),
        data: account
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

  async updateAccount(authedRequest: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const accountId = parseInt((authedRequest.params as any).id);
      const updateData: UpdateAccountBody = authedRequest.body as any;
      
      const account = await this.accountService.updateAccount(accountId, authedRequest.user.id, updateData);

      const response: ApiResponse = {
        success: true,
        message: I18nUtils.translate('account.updated', authedRequest.user.language),
        data: account
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
      const accountId = parseInt((authedRequest.params as any).id);
      await this.accountService.deleteAccount(accountId, authedRequest.user.id);

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

  async getAccountSummary(authedRequest: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const summary = await this.accountService.getAccountSummary(authedRequest.user.id);

      const response: ApiResponse = {
        success: true,
        data: summary
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
