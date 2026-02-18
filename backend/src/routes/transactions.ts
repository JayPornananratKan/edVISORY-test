import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Transaction } from '../entities/Transaction';
import { Account } from '../entities/Account';
import { Category } from '../entities/Category';
import { AppDataSource } from '../config/database';
import { ApiResponse, AuthenticatedRequest } from '../types';
import { authMiddleware } from '../middleware/auth';
import { I18nUtils } from '../utils/i18n';

interface CreateTransactionBody {
  account_id: number;
  category_id: number;
  amount: number;
  transaction_type: 'income' | 'expense' | 'transfer';
  description?: string;
  notes?: string;
  transaction_date: string;
  transaction_time?: string;
  location?: string;
  tags?: string[];
  is_recurring?: boolean;
  recurring_pattern?: string;
  recurring_end_date?: string;
  reference_number?: string;
}

interface UpdateTransactionBody {
  account_id?: number;
  category_id?: number;
  amount?: number;
  transaction_type?: 'income' | 'expense' | 'transfer';
  description?: string;
  notes?: string;
  transaction_date?: string;
  transaction_time?: string;
  location?: string;
  tags?: string[];
  is_recurring?: boolean;
  recurring_pattern?: string;
  recurring_end_date?: string;
  reference_number?: string;
}

interface TransactionQuery {
  page?: number;
  limit?: number;
  account_id?: number;
  category_id?: number;
  transaction_type?: string;
  search?: string;
  start_date?: string;
  end_date?: string;
  min_amount?: number;
  max_amount?: number;
  tags?: string[];
}

export async function transactionRoutes(fastify: FastifyInstance) {
  const transactionRepository = AppDataSource.getRepository(Transaction);
  const accountRepository = AppDataSource.getRepository(Account);
  const categoryRepository = AppDataSource.getRepository(Category);

  // Create new transaction
  fastify.post<{ Body: CreateTransactionBody }>('/transactions', {
    preHandler: authMiddleware
  }, async (request: FastifyRequest<{ Body: CreateTransactionBody }>, reply: FastifyReply) => {
    const authedRequest = request as AuthenticatedRequest;
    try {
      const { 
        account_id, 
        category_id, 
        amount, 
        transaction_type, 
        description, 
        notes, 
        transaction_date, 
        transaction_time, 
        location, 
        tags, 
        is_recurring, 
        recurring_pattern, 
        recurring_end_date, 
        reference_number 
      } = request.body;

      // Validate account belongs to user
      const account = await accountRepository.findOne({
        where: { id: account_id, user_id: authedRequest.user.id, is_active: true }
      });

      if (!account) {
        const response: ApiResponse = {
          success: false,
          message: I18nUtils.translate('transaction.account_not_found', authedRequest.user.language),
          error: 'Account not found'
        };
        return reply.code(404).send(response);
      }

      // Validate category belongs to user
      const category = await categoryRepository.findOne({
        where: { id: category_id, user_id: authedRequest.user.id, is_active: true }
      });

      if (!category) {
        const response: ApiResponse = {
          success: false,
          message: I18nUtils.translate('transaction.category_not_found', authedRequest.user.language),
          error: 'Category not found'
        };
        return reply.code(404).send(response);
      }

      // Parse transaction date and time
      const transactionDateTime = new Date(transaction_date);
      if (transaction_time) {
        const [hours, minutes] = transaction_time.split(':');
        transactionDateTime.setHours(parseInt(hours), parseInt(minutes));
      }

      // Create new transaction
      const transaction = transactionRepository.create({
        user_id: authedRequest.user.id,
        account_id,
        category_id,
        amount,
        transaction_type,
        description,
        notes,
        transaction_date: transactionDateTime,
        location,
        tags: tags || [],
        is_recurring: is_recurring || false,
        recurring_pattern,
        recurring_end_date: recurring_end_date ? new Date(recurring_end_date) : undefined,
        reference_number
      });

      await transactionRepository.save(transaction);

      // Update account balance (simplified - in production you'd handle this more carefully)
      if (transaction_type === 'income') {
        account.current_balance += amount;
      } else if (transaction_type === 'expense') {
        account.current_balance -= amount;
      }
      // Transfers would be handled separately

      await accountRepository.save(account);

      const response: ApiResponse = {
        success: true,
        message: I18nUtils.translate('transaction.created', authedRequest.user.language),
        data: {
          id: transaction.id,
          account_id: transaction.account_id,
          category_id: transaction.category_id,
          amount: transaction.amount,
          transaction_type: transaction.transaction_type,
          description: transaction.description,
          notes: transaction.notes,
          transaction_date: transaction.transaction_date,
          location: transaction.location,
          tags: transaction.tags,
          is_recurring: transaction.is_recurring,
          recurring_pattern: transaction.recurring_pattern,
          recurring_end_date: transaction.recurring_end_date,
          reference_number: transaction.reference_number,
          created_at: transaction.created_at
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

  // Get all transactions for authenticated user
  fastify.get<{ Querystring: TransactionQuery }>('/transactions', {
    preHandler: authMiddleware
  }, async (request: FastifyRequest<{ Querystring: TransactionQuery }>, reply: FastifyReply) => {
    const authedRequest = request as AuthenticatedRequest;
    try {
      const { 
        page = 1, 
        limit = 20, 
        account_id, 
        category_id, 
        transaction_type, 
        search, 
        start_date, 
        end_date, 
        min_amount, 
        max_amount, 
        tags 
      } = request.query;

      // Build query
      const queryBuilder = transactionRepository
        .createQueryBuilder('transaction')
        .leftJoinAndSelect('transaction.account', 'account')
        .leftJoinAndSelect('transaction.category', 'category')
        .where('transaction.user_id = :userId', { userId: authedRequest.user.id });

      // Add filters
      if (account_id) {
        queryBuilder.andWhere('transaction.account_id = :account_id', { account_id });
      }

      if (category_id) {
        queryBuilder.andWhere('transaction.category_id = :category_id', { category_id });
      }

      if (transaction_type) {
        queryBuilder.andWhere('transaction.transaction_type = :transaction_type', { transaction_type });
      }

      if (search) {
        queryBuilder.andWhere(
          '(transaction.description ILIKE :search OR transaction.notes ILIKE :search OR transaction.reference_number ILIKE :search)',
          { search: `%${search}%` }
        );
      }

      if (start_date) {
        queryBuilder.andWhere('transaction.transaction_date >= :start_date', { 
          start_date: new Date(start_date) 
        });
      }

      if (end_date) {
        queryBuilder.andWhere('transaction.transaction_date <= :end_date', { 
          end_date: new Date(end_date) 
        });
      }

      if (min_amount) {
        queryBuilder.andWhere('transaction.amount >= :min_amount', { min_amount });
      }

      if (max_amount) {
        queryBuilder.andWhere('transaction.amount <= :max_amount', { max_amount });
      }

      if (tags && tags.length > 0) {
        queryBuilder.andWhere('transaction.tags && :tags', { tags });
      }

      // Add pagination
      const skip = (page - 1) * limit;
      queryBuilder.skip(skip).take(limit);
      queryBuilder.orderBy('transaction.transaction_date', 'DESC');

      const [transactions, total] = await queryBuilder.getManyAndCount();

      const totalPages = Math.ceil(total / limit);

      const response: ApiResponse = {
        success: true,
        data: transactions.map(transaction => ({
          id: transaction.id,
          account_id: transaction.account_id,
          category_id: transaction.category_id,
          amount: transaction.amount,
          transaction_type: transaction.transaction_type,
          description: transaction.description,
          notes: transaction.notes,
          transaction_date: transaction.transaction_date,
          location: transaction.location,
          tags: transaction.tags,
          is_recurring: transaction.is_recurring,
          recurring_pattern: transaction.recurring_pattern,
          recurring_end_date: transaction.recurring_end_date,
          reference_number: transaction.reference_number,
          created_at: transaction.created_at,
          updated_at: transaction.updated_at
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

  // Get single transaction
  fastify.get<{ Params: { id: string } }>('/transactions/:id', {
    preHandler: authMiddleware
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const authedRequest = request as AuthenticatedRequest;
    try {
      const transactionId = parseInt(request.params.id);

      if (isNaN(transactionId)) {
        const response: ApiResponse = {
          success: false,
          message: I18nUtils.translate('general.invalid_request', authedRequest.user.language),
          error: 'Invalid transaction ID'
        };
        return reply.code(400).send(response);
      }

      const transaction = await transactionRepository.findOne({
        where: { id: transactionId, user_id: authedRequest.user.id }
      });

      if (!transaction) {
        const response: ApiResponse = {
          success: false,
          message: I18nUtils.translate('transaction.not_found', authedRequest.user.language),
          error: 'Transaction not found'
        };
        return reply.code(404).send(response);
      }

      const response: ApiResponse = {
        success: true,
        data: {
          id: transaction.id,
          account_id: transaction.account_id,
          category_id: transaction.category_id,
          amount: transaction.amount,
          transaction_type: transaction.transaction_type,
          description: transaction.description,
          notes: transaction.notes,
          transaction_date: transaction.transaction_date,
          location: transaction.location,
          tags: transaction.tags,
          is_recurring: transaction.is_recurring,
          recurring_pattern: transaction.recurring_pattern,
          recurring_end_date: transaction.recurring_end_date,
          reference_number: transaction.reference_number,
          created_at: transaction.created_at
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

  // Update transaction
  fastify.patch<{ Params: { id: string }; Body: UpdateTransactionBody }>('/transactions/:id', {
    preHandler: authMiddleware
  }, async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateTransactionBody }>, reply: FastifyReply) => {
    const authedRequest = request as AuthenticatedRequest;
    try {
      const transactionId = parseInt(request.params.id);

      if (isNaN(transactionId)) {
        const response: ApiResponse = {
          success: false,
          message: I18nUtils.translate('general.invalid_request', authedRequest.user.language),
          error: 'Invalid transaction ID'
        };
        return reply.code(400).send(response);
      }

      const transaction = await transactionRepository.findOne({
        where: { id: transactionId, user_id: authedRequest.user.id },
        relations: ['account']
      });

      if (!transaction) {
        const response: ApiResponse = {
          success: false,
          message: I18nUtils.translate('transaction.not_found', authedRequest.user.language),
          error: 'Transaction not found'
        };
        return reply.code(404).send(response);
      }

      // Store old values for balance adjustment
      const oldAmount = transaction.amount;
      const oldType = transaction.transaction_type;
      const oldAccountId = transaction.account_id;

      const updates = request.body;

      // Validate new account if changed
      if (updates.account_id && updates.account_id !== transaction.account_id) {
        const newAccount = await accountRepository.findOne({
          where: { id: updates.account_id, user_id: authedRequest.user.id, is_active: true }
        });

        if (!newAccount) {
          const response: ApiResponse = {
            success: false,
            message: I18nUtils.translate('transaction.account_not_found', authedRequest.user.language),
            error: 'Account not found'
          };
          return reply.code(404).send(response);
        }
      }

      // Validate new category if changed
      if (updates.category_id && updates.category_id !== transaction.category_id) {
        const newCategory = await categoryRepository.findOne({
          where: { id: updates.category_id, user_id: authedRequest.user.id, is_active: true }
        });

        if (!newCategory) {
          const response: ApiResponse = {
            success: false,
            message: I18nUtils.translate('transaction.category_not_found', authedRequest.user.language),
            error: 'Category not found'
          };
          return reply.code(404).send(response);
        }
      }

      // Update transaction date if provided
      let transactionDateToUpdate: Date | undefined;
      if (updates.transaction_date) {
        transactionDateToUpdate = new Date(updates.transaction_date);
      }

      // Update transaction fields (exclude transaction_date from direct assignment)
      const { transaction_date, ...otherUpdates } = updates;
      Object.assign(transaction, otherUpdates);
      
      // Set transaction_date separately if it was provided
      if (transactionDateToUpdate) {
        transaction.transaction_date = transactionDateToUpdate;
      }

      await transactionRepository.save(transaction);

      // Adjust account balances (simplified)
      if (updates.account_id && updates.account_id !== oldAccountId) {
        // Revert old account balance
        const oldAccount = await accountRepository.findOne({
          where: { id: oldAccountId, user_id: authedRequest.user.id }
        });
        if (oldAccount) {
          if (oldType === 'income') {
            oldAccount.current_balance -= oldAmount;
          } else if (oldType === 'expense') {
            oldAccount.current_balance += oldAmount;
          }
          await accountRepository.save(oldAccount);
        }

        // Apply to new account
        const newAccount = await accountRepository.findOne({
          where: { id: updates.account_id, user_id: authedRequest.user.id }
        });
        if (newAccount) {
          const newAmount = updates.amount || oldAmount;
          const newType = updates.transaction_type || oldType;
          if (newType === 'income') {
            newAccount.current_balance += newAmount;
          } else if (newType === 'expense') {
            newAccount.current_balance -= newAmount;
          }
          await accountRepository.save(newAccount);
        }
      } else if (updates.amount !== undefined || updates.transaction_type !== undefined) {
        // Same account but amount or type changed
        const account = await accountRepository.findOne({
          where: { id: transaction.account_id, user_id: authedRequest.user.id }
        });
        if (account) {
          // Revert old transaction
          if (oldType === 'income') {
            account.current_balance -= oldAmount;
          } else if (oldType === 'expense') {
            account.current_balance += oldAmount;
          }

          // Apply new transaction
          const newAmount = updates.amount || oldAmount;
          const newType = updates.transaction_type || oldType;
          if (newType === 'income') {
            account.current_balance += newAmount;
          } else if (newType === 'expense') {
            account.current_balance -= newAmount;
          }

          await accountRepository.save(account);
        }
      }

      // Reload transaction
      const updatedTransaction = await transactionRepository.findOne({
        where: { id: transactionId, user_id: authedRequest.user.id }
      });

      const response: ApiResponse = {
        success: true,
        message: I18nUtils.translate('transaction.updated', authedRequest.user.language),
        data: {
          id: updatedTransaction!.id,
          account_id: updatedTransaction!.account_id,
          category_id: updatedTransaction!.category_id,
          amount: updatedTransaction!.amount,
          transaction_type: updatedTransaction!.transaction_type,
          description: updatedTransaction!.description,
          notes: updatedTransaction!.notes,
          transaction_date: updatedTransaction!.transaction_date,
          location: updatedTransaction!.location,
          tags: updatedTransaction!.tags,
          is_recurring: updatedTransaction!.is_recurring,
          recurring_pattern: updatedTransaction!.recurring_pattern,
          recurring_end_date: updatedTransaction!.recurring_end_date,
          reference_number: updatedTransaction!.reference_number,
          created_at: updatedTransaction!.created_at
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

  // Delete transaction
  fastify.delete<{ Params: { id: string } }>('/transactions/:id', {
    preHandler: authMiddleware
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const authedRequest = request as AuthenticatedRequest;
    try {
      const transactionId = parseInt(request.params.id);

      if (isNaN(transactionId)) {
        const response: ApiResponse = {
          success: false,
          message: I18nUtils.translate('general.invalid_request', authedRequest.user.language),
          error: 'Invalid transaction ID'
        };
        return reply.code(400).send(response);
      }

      const transaction = await transactionRepository.findOne({
        where: { id: transactionId, user_id: authedRequest.user.id },
        relations: ['account']
      });

      if (!transaction) {
        const response: ApiResponse = {
          success: false,
          message: I18nUtils.translate('transaction.not_found', authedRequest.user.language),
          error: 'Transaction not found'
        };
        return reply.code(404).send(response);
      }

      // Adjust account balance
      const account = await accountRepository.findOne({
        where: { id: transaction.account_id, user_id: authedRequest.user.id }
      });
      if (account) {
        if (transaction.transaction_type === 'income') {
          account.current_balance -= transaction.amount;
        } else if (transaction.transaction_type === 'expense') {
          account.current_balance += transaction.amount;
        }
        await accountRepository.save(account);
      }

      // Delete transaction
      await transactionRepository.remove(transaction);

      const response: ApiResponse = {
        success: true,
        message: I18nUtils.translate('transaction.deleted', authedRequest.user.language)
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
