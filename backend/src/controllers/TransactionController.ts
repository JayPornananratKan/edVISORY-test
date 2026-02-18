import { FastifyInstance, FastifyReply } from 'fastify';
import { ApiResponse, AuthenticatedRequest } from '../types';
import { TransactionService } from '../services/TransactionService';

interface CreateTransactionBody {
  account_id: number;
  category_id: number;
  amount: number;
  transaction_type: 'income' | 'expense';
  description: string;
  notes?: string;
  transaction_date: string;
  transaction_time?: string;
  location?: string;
  tags?: string[];
  is_recurring?: boolean;
  recurring_pattern?: string;
  reference_number?: string;
}

interface UpdateTransactionBody {
  account_id?: number;
  category_id?: number;
  amount?: number;
  description?: string;
  notes?: string;
  transaction_date?: string;
  transaction_time?: string;
  location?: string;
  tags?: string[];
  is_recurring?: boolean;
  recurring_pattern?: string;
  reference_number?: string;
}

export class TransactionController {
  private transactionService = new TransactionService();

  async getTransactions(authedRequest: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const page = parseInt((authedRequest.query as any).page) || 1;
      const limit = parseInt((authedRequest.query as any).limit) || 20;
      const { start_date, end_date, transaction_type, account_id, category_id } = authedRequest.query as any;

      const result = await this.transactionService.getTransactions(authedRequest.user.id, {
        start_date,
        end_date,
        transaction_type,
        account_id: account_id ? parseInt(account_id) : undefined,
        category_id: category_id ? parseInt(category_id) : undefined
      }, page, limit);

      const response: ApiResponse = {
        success: true,
        data: result.transactions,
        pagination: result.pagination
      };

      return reply.send(response);

    } catch (error) {
      authedRequest.log.error(error);
      const response: ApiResponse = {
        success: false,
        message: 'Server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      return reply.code(500).send(response);
    }
  }

  async createTransaction(authedRequest: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const transactionData = authedRequest.body as CreateTransactionBody;

      const result = await this.transactionService.createTransaction({
        ...transactionData,
        userId: authedRequest.user.id
      });

      const response: ApiResponse = {
        success: true,
        message: 'Transaction created successfully',
        data: result
      };

      return reply.code(201).send(response);

    } catch (error) {
      authedRequest.log.error(error);
      
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : 'Server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      if (error instanceof Error && (error.message === 'Account not found' || error.message === 'Category not found')) {
        return reply.code(404).send(response);
      }
      
      return reply.code(500).send(response);
    }
  }

  async getTransactionById(authedRequest: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { id } = authedRequest.params as { id: string };

      const result = await this.transactionService.getTransactionById(parseInt(id), authedRequest.user.id);

      const response: ApiResponse = {
        success: true,
        data: result
      };

      return reply.send(response);

    } catch (error) {
      authedRequest.log.error(error);
      
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : 'Server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      if (error instanceof Error && error.message === 'Transaction not found') {
        return reply.code(404).send(response);
      }
      
      return reply.code(500).send(response);
    }
  }

  async updateTransaction(authedRequest: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { id } = authedRequest.params as { id: string };
      const updates = authedRequest.body as UpdateTransactionBody;

      const result = await this.transactionService.updateTransaction(parseInt(id), authedRequest.user.id, updates);

      const response: ApiResponse = {
        success: true,
        message: 'Transaction updated successfully',
        data: result
      };

      return reply.send(response);

    } catch (error) {
      authedRequest.log.error(error);
      
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : 'Server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      if (error instanceof Error && (error.message === 'Transaction not found' || error.message === 'Account not found' || error.message === 'Category not found')) {
        return reply.code(404).send(response);
      }
      
      return reply.code(500).send(response);
    }
  }

  async deleteTransaction(authedRequest: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { id } = authedRequest.params as { id: string };

      const result = await this.transactionService.deleteTransaction(parseInt(id), authedRequest.user.id);

      const response: ApiResponse = {
        success: true,
        message: result.message
      };

      return reply.send(response);

    } catch (error) {
      authedRequest.log.error(error);
      
      const response: ApiResponse = {
        success: false,
        message: error instanceof Error ? error.message : 'Server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      if (error instanceof Error && error.message === 'Transaction not found') {
        return reply.code(404).send(response);
      }
      
      return reply.code(500).send(response);
    }
  }
}
