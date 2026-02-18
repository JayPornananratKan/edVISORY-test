import { FastifyInstance, FastifyReply } from 'fastify';
import { Transaction } from '../entities/Transaction';
import { Account } from '../entities/Account';
import { Category } from '../entities/Category';
import { AppDataSource } from '../config/database';
import { I18nUtils } from '../utils/i18n';
import { ApiResponse, AuthenticatedRequest } from '../types';

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
  private transactionRepository = AppDataSource.getRepository(Transaction);
  private accountRepository = AppDataSource.getRepository(Account);
  private categoryRepository = AppDataSource.getRepository(Category);

  async getTransactions(authedRequest: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const page = parseInt((authedRequest.query as any).page) || 1;
      const limit = parseInt((authedRequest.query as any).limit) || 20;
      const skip = (page - 1) * limit;
      const { start_date, end_date, transaction_type, account_id, category_id } = authedRequest.query as any;

      let whereCondition: any = { user_id: authedRequest.user.id };

      if (start_date) {
        whereCondition.transaction_date = { ...whereCondition.transaction_date, $gte: new Date(start_date) };
      }
      if (end_date) {
        whereCondition.transaction_date = { ...whereCondition.transaction_date, $lte: new Date(end_date) };
      }
      if (transaction_type) {
        whereCondition.transaction_type = transaction_type;
      }
      if (account_id) {
        whereCondition.account_id = parseInt(account_id);
      }
      if (category_id) {
        whereCondition.category_id = parseInt(category_id);
      }

      const [transactions, total] = await this.transactionRepository.findAndCount({
        where: whereCondition,
        skip,
        take: limit,
        order: { created_at: 'DESC' },
        relations: ['account', 'category']
      });

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
          transaction_time: transaction.transaction_time,
          location: transaction.location,
          tags: transaction.tags,
          is_recurring: transaction.is_recurring,
          recurring_pattern: transaction.recurring_pattern,
          reference_number: transaction.reference_number,
          created_at: transaction.created_at,
          updated_at: transaction.updated_at
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

  async createTransaction(authedRequest: AuthenticatedRequest, reply: FastifyReply) {
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
        reference_number
      } = authedRequest.body as CreateTransactionBody;

      // Verify account belongs to user
      const account = await this.accountRepository.findOne({
        where: { id: account_id, user_id: authedRequest.user.id }
      });

      if (!account) {
        const response: ApiResponse = {
          success: false,
          message: I18nUtils.translate('transaction.account_not_found', authedRequest.user.language)
        };
        return reply.code(404).send(response);
      }

      // Verify category belongs to user
      const category = await this.categoryRepository.findOne({
        where: { id: category_id, user_id: authedRequest.user.id }
      });

      if (!category) {
        const response: ApiResponse = {
          success: false,
          message: I18nUtils.translate('transaction.category_not_found', authedRequest.user.language)
        };
        return reply.code(404).send(response);
      }

      // Create transaction
      const transaction = this.transactionRepository.create({
        user_id: authedRequest.user.id,
        account_id,
        category_id,
        amount,
        transaction_type,
        description,
        notes,
        transaction_date: new Date(transaction_date) as Date,
        transaction_time: transaction_time ? new Date(`1970-01-01T${transaction_time}`) as Date : new Date() as Date,
        location,
        tags: tags || [],
        is_recurring: is_recurring || false,
        recurring_pattern,
        reference_number
      });

      await this.transactionRepository.save(transaction);

      // Update account balance
      if (transaction_type === 'income') {
        account.current_balance += amount;
      } else {
        account.current_balance -= amount;
      }
      await this.accountRepository.save(account);

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
          transaction_time: transaction.transaction_time,
          location: transaction.location,
          tags: transaction.tags,
          is_recurring: transaction.is_recurring,
          recurring_pattern: transaction.recurring_pattern,
          reference_number: transaction.reference_number,
          created_at: transaction.created_at,
          updated_at: transaction.updated_at
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

  async getTransactionById(authedRequest: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { id } = authedRequest.params as { id: string };

      const transaction = await this.transactionRepository.findOne({
        where: { id: parseInt(id), user_id: authedRequest.user.id },
        relations: ['account', 'category']
      });

      if (!transaction) {
        const response: ApiResponse = {
          success: false,
          message: I18nUtils.translate('transaction.not_found', authedRequest.user.language)
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
          transaction_time: transaction.transaction_time,
          location: transaction.location,
          tags: transaction.tags,
          is_recurring: transaction.is_recurring,
          recurring_pattern: transaction.recurring_pattern,
          reference_number: transaction.reference_number,
          created_at: transaction.created_at,
          updated_at: transaction.updated_at
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

  async updateTransaction(authedRequest: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { id } = authedRequest.params as { id: string };
      const updates = authedRequest.body as UpdateTransactionBody;

      const transaction = await this.transactionRepository.findOne({
        where: { id: parseInt(id), user_id: authedRequest.user.id }
      });

      if (!transaction) {
        const response: ApiResponse = {
          success: false,
          message: I18nUtils.translate('transaction.not_found', authedRequest.user.language)
        };
        return reply.code(404).send(response);
      }

      // Store original values for balance update
      const originalAccountId = transaction.account_id;
      const originalAmount = transaction.amount;
      const originalType = transaction.transaction_type;

      // Update transaction fields
      let balanceUpdateNeeded = false;
      let newAccountId = originalAccountId;
      let newAmount = originalAmount;
      let newType = originalType;

      if (updates.account_id !== undefined) {
        // Verify new account belongs to user
        const newAccount = await this.accountRepository.findOne({
          where: { id: updates.account_id, user_id: authedRequest.user.id }
        });

        if (!newAccount) {
          const response: ApiResponse = {
            success: false,
            message: I18nUtils.translate('transaction.account_not_found', authedRequest.user.language)
          };
          return reply.code(404).send(response);
        }

        transaction.account_id = updates.account_id;
        newAccountId = updates.account_id;
        balanceUpdateNeeded = true;
      }

      if (updates.category_id !== undefined) {
        // Verify new category belongs to user
        const newCategory = await this.categoryRepository.findOne({
          where: { id: updates.category_id, user_id: authedRequest.user.id }
        });

        if (!newCategory) {
          const response: ApiResponse = {
            success: false,
            message: I18nUtils.translate('transaction.category_not_found', authedRequest.user.language)
          };
          return reply.code(404).send(response);
        }

        transaction.category_id = updates.category_id;
      }

      if (updates.amount !== undefined) {
        transaction.amount = updates.amount;
        newAmount = updates.amount;
        balanceUpdateNeeded = true;
      }

      if (updates.description) transaction.description = updates.description;
      if (updates.notes) transaction.notes = updates.notes;
      if (updates.transaction_date) transaction.transaction_date = new Date(updates.transaction_date) as Date;
      if (updates.transaction_time) transaction.transaction_time = new Date(`1970-01-01T${updates.transaction_time}`) as Date;
      if (updates.location) transaction.location = updates.location;
      if (updates.tags) transaction.tags = updates.tags;
      if (updates.is_recurring !== undefined) transaction.is_recurring = updates.is_recurring;
      if (updates.recurring_pattern) transaction.recurring_pattern = updates.recurring_pattern;
      if (updates.reference_number) transaction.reference_number = updates.reference_number;

      await this.transactionRepository.save(transaction);

      // Update account balances if needed
      if (balanceUpdateNeeded) {
        // Revert original transaction from original account
        const originalAccount = await this.accountRepository.findOne({
          where: { id: originalAccountId, user_id: authedRequest.user.id }
        });

        if (originalAccount) {
          if (originalType === 'income') {
            originalAccount.current_balance -= originalAmount;
          } else {
            originalAccount.current_balance += originalAmount;
          }
          await this.accountRepository.save(originalAccount);
        }

        // Apply new transaction to new account
        const newAccount = await this.accountRepository.findOne({
          where: { id: newAccountId, user_id: authedRequest.user.id }
        });

        if (newAccount) {
          if (newType === 'income') {
            newAccount.current_balance += newAmount;
          } else {
            newAccount.current_balance -= newAmount;
          }
          await this.accountRepository.save(newAccount);
        }
      }

      const response: ApiResponse = {
        success: true,
        message: I18nUtils.translate('transaction.updated', authedRequest.user.language),
        data: {
          id: transaction.id,
          account_id: transaction.account_id,
          category_id: transaction.category_id,
          amount: transaction.amount,
          transaction_type: transaction.transaction_type,
          description: transaction.description,
          notes: transaction.notes,
          transaction_date: transaction.transaction_date,
          transaction_time: transaction.transaction_time,
          location: transaction.location,
          tags: transaction.tags,
          is_recurring: transaction.is_recurring,
          recurring_pattern: transaction.recurring_pattern,
          reference_number: transaction.reference_number,
          created_at: transaction.created_at,
          updated_at: transaction.updated_at
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

  async deleteTransaction(authedRequest: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { id } = authedRequest.params as { id: string };

      const transaction = await this.transactionRepository.findOne({
        where: { id: parseInt(id), user_id: authedRequest.user.id }
      });

      if (!transaction) {
        const response: ApiResponse = {
          success: false,
          message: I18nUtils.translate('transaction.not_found', authedRequest.user.language)
        };
        return reply.code(404).send(response);
      }

      // Update account balance
      const account = await this.accountRepository.findOne({
        where: { id: transaction.account_id, user_id: authedRequest.user.id }
      });

      if (account) {
        if (transaction.transaction_type === 'income') {
          account.current_balance -= transaction.amount;
        } else {
          account.current_balance += transaction.amount;
        }
        await this.accountRepository.save(account);
      }

      // Delete transaction
      await this.transactionRepository.remove(transaction);

      const response: ApiResponse = {
        success: true,
        message: I18nUtils.translate('transaction.deleted', authedRequest.user.language)
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
