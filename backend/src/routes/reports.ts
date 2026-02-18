import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Transaction } from '../entities/Transaction';
import { Account } from '../entities/Account';
import { Category } from '../entities/Category';
import { AppDataSource } from '../config/database';
import { ApiResponse, AuthenticatedRequest } from '../types';
import { authMiddleware } from '../middleware/auth';
import { I18nUtils } from '../utils/i18n';

interface TransactionSummaryQuery {
  start_date?: string;
  end_date?: string;
  account_id?: number;
  category_id?: number;
  transaction_type?: string;
  group_by?: 'day' | 'week' | 'month' | 'year';
}

interface DailySpendingQuery {
  month: number;
  year: number;
  target_monthly_spending?: number;
}

interface ExportQuery {
  format: 'excel' | 'csv' | 'json';
  start_date?: string;
  end_date?: string;
  account_id?: number;
  category_id?: number;
  transaction_type?: string;
}

export async function reportRoutes(fastify: FastifyInstance) {
  const transactionRepository = AppDataSource.getRepository(Transaction);
  const accountRepository = AppDataSource.getRepository(Account);
  const categoryRepository = AppDataSource.getRepository(Category);

  // Transaction summary report
  fastify.get<{ Querystring: TransactionSummaryQuery }>('/reports/transaction-summary', {
    preHandler: authMiddleware
  }, async (request: FastifyRequest<{ Querystring: TransactionSummaryQuery }>, reply: FastifyReply) => {
    const authedRequest = request as AuthenticatedRequest;
    try {
      const { 
        start_date, 
        end_date, 
        account_id, 
        category_id, 
        transaction_type, 
        group_by = 'month' 
      } = request.query;

      // Build query
      const queryBuilder = transactionRepository
        .createQueryBuilder('transaction')
        .leftJoin(Account, 'account', 'account.id = transaction.account_id')
        .leftJoin(Category, 'category', 'category.id = transaction.category_id')
        .where('transaction.user_id = :userId', { userId: authedRequest.user.id });

      // Add filters
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

      if (account_id) {
        queryBuilder.andWhere('transaction.account_id = :account_id', { account_id });
      }

      if (category_id) {
        queryBuilder.andWhere('transaction.category_id = :category_id', { category_id });
      }

      if (transaction_type) {
        queryBuilder.andWhere('transaction.transaction_type = :transaction_type', { transaction_type });
      }

      // Group by date period
      let dateFormat: string;
      switch (group_by) {
        case 'day':
          dateFormat = 'YYYY-MM-DD';
          break;
        case 'week':
          dateFormat = 'YYYY-"W"WW';
          break;
        case 'year':
          dateFormat = 'YYYY';
          break;
        case 'month':
        default:
          dateFormat = 'YYYY-MM';
          break;
      }

      queryBuilder
        .select(`TO_CHAR(transaction.transaction_date, '${dateFormat}')`, 'period')
        .addSelect('SUM(CASE WHEN transaction.transaction_type = \'income\' THEN transaction.amount ELSE 0 END)', 'total_income')
        .addSelect('SUM(CASE WHEN transaction.transaction_type = \'expense\' THEN transaction.amount ELSE 0 END)', 'total_expense')
        .addSelect('COUNT(transaction.id)', 'transaction_count')
        .groupBy(`TO_CHAR(transaction.transaction_date, '${dateFormat}')`)
        .orderBy('period', 'ASC');

      const results = await queryBuilder.getRawMany();

      // Calculate category breakdown for each period
      const summaryData = [];
      for (const result of results) {
        const categoryQuery = transactionRepository
          .createQueryBuilder('transaction')
          .leftJoin(Category, 'category', 'category.id = transaction.category_id')
          .where('transaction.user_id = :userId', { userId: authedRequest.user.id })
          .andWhere(`TO_CHAR(transaction.transaction_date, '${dateFormat}') = :period`, { period: result.period });

        if (account_id) {
          categoryQuery.andWhere('transaction.account_id = :account_id', { account_id });
        }

        if (transaction_type) {
          categoryQuery.andWhere('transaction.transaction_type = :transaction_type', { transaction_type });
        }

        const categoryBreakdown = await categoryQuery
          .select('category.name', 'category_name')
          .addSelect('category.color', 'color')
          .addSelect('SUM(transaction.amount)', 'amount')
          .addSelect('COUNT(transaction.id)', 'count')
          .groupBy('category.id, category.name, category.color')
          .orderBy('amount', 'DESC')
          .getRawMany();

        const totalAmount = categoryBreakdown.reduce((sum, cat) => sum + parseFloat(cat.amount), 0);

        summaryData.push({
          period: result.period,
          total_income: parseFloat(result.total_income) || 0,
          total_expense: parseFloat(result.total_expense) || 0,
          net_amount: (parseFloat(result.total_income) || 0) - (parseFloat(result.total_expense) || 0),
          transaction_count: parseInt(result.transaction_count) || 0,
          breakdown: categoryBreakdown.map(cat => ({
            category_id: cat.category_id,
            category_name: cat.category_name,
            amount: parseFloat(cat.amount),
            percentage: totalAmount > 0 ? (parseFloat(cat.amount) / totalAmount) * 100 : 0
          }))
        });
      }

      const response: ApiResponse = {
        success: true,
        data: summaryData
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

  // Daily spending analysis
  fastify.get<{ Querystring: DailySpendingQuery }>('/reports/daily-spending', {
    preHandler: authMiddleware
  }, async (request: FastifyRequest<{ Querystring: DailySpendingQuery }>, reply: FastifyReply) => {
    const authedRequest = request as AuthenticatedRequest;
    try {
      const { month, year, target_monthly_spending } = request.query;

      // Validate month and year
      if (month < 1 || month > 12) {
        const response: ApiResponse = {
          success: false,
          message: I18nUtils.translate('general.invalid_request', authedRequest.user.language),
          error: 'Invalid month'
        };
        return reply.code(400).send(response);
      }

      const currentYear = new Date().getFullYear();
      if (year < 2020 || year > currentYear + 1) {
        const response: ApiResponse = {
          success: false,
          message: I18nUtils.translate('general.invalid_request', authedRequest.user.language),
          error: 'Invalid year'
        };
        return reply.code(400).send(response);
      }

      // Get total expenses for the month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0); // Last day of the month

      const totalExpensesQuery = transactionRepository
        .createQueryBuilder('transaction')
        .select('SUM(transaction.amount)', 'total')
        .where('transaction.user_id = :userId', { userId: authedRequest.user.id })
        .andWhere('transaction.transaction_type = :transaction_type', { transaction_type: 'expense' })
        .andWhere('transaction.transaction_date >= :startDate', { startDate })
        .andWhere('transaction.transaction_date <= :endDate', { endDate });

      const totalExpensesResult = await totalExpensesQuery.getRawOne();
      const currentMonthSpending = parseFloat(totalExpensesResult.total) || 0;

      // Calculate days remaining and daily allowance
      const today = new Date();
      const daysInMonth = endDate.getDate();
      const currentDay = today.getDate();
      const daysRemaining = daysInMonth - currentDay;

      let dailyAllowance = 0;
      let status: 'on_track' | 'over_budget' | 'under_budget' = 'on_track';

      if (target_monthly_spending) {
        dailyAllowance = target_monthly_spending / daysInMonth;
        const currentDailyAverage = currentMonthSpending / currentDay;
        const recommendedDailySpending = target_monthly_spending / daysInMonth;

        if (currentMonthSpending > target_monthly_spending) {
          status = 'over_budget';
        } else if (currentDailyAverage > recommendedDailySpending * 1.2) {
          status = 'over_budget';
        } else if (currentDailyAverage < recommendedDailySpending * 0.8) {
          status = 'under_budget';
        }
      }

      const response: ApiResponse = {
        success: true,
        data: {
          month,
          year,
          days_in_month: daysInMonth,
          current_day: currentDay,
          days_remaining: Math.max(0, daysRemaining),
          current_month_spending: currentMonthSpending,
          target_monthly_spending,
          daily_allowance: dailyAllowance,
          current_daily_average: currentMonthSpending / currentDay,
          recommended_daily_spending: dailyAllowance,
          status
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

  // Account balance summary
  fastify.get('/reports/account-summary', {
    preHandler: authMiddleware
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const authedRequest = request as AuthenticatedRequest;
    try {
      // Get all accounts for the user
      const accounts = await accountRepository.find({
        where: { user_id: authedRequest.user.id, is_active: true },
        order: { name: 'ASC' }
      });

      // Get total balance by account type
      const balanceByType = accounts.reduce((acc, account) => {
        if (!acc[account.account_type]) {
          acc[account.account_type] = {
            total_balance: 0,
            account_count: 0,
            accounts: []
          };
        }
        acc[account.account_type].total_balance += account.current_balance;
        acc[account.account_type].account_count += 1;
        acc[account.account_type].accounts.push({
          id: account.id,
          name: account.name,
          balance: account.current_balance,
          currency: account.currency
        });
        return acc;
      }, {} as Record<string, any>);

      // Calculate totals
      const totalBalance = accounts.reduce((sum, account) => sum + account.current_balance, 0);
      const totalIncome = await transactionRepository
        .createQueryBuilder('transaction')
        .select('SUM(transaction.amount)', 'total')
        .where('transaction.user_id = :userId', { userId: authedRequest.user.id })
        .andWhere('transaction.transaction_type = :transaction_type', { transaction_type: 'income' })
        .getRawOne();

      const totalExpenses = await transactionRepository
        .createQueryBuilder('transaction')
        .select('SUM(transaction.amount)', 'total')
        .where('transaction.user_id = :userId', { userId: authedRequest.user.id })
        .andWhere('transaction.transaction_type = :transaction_type', { transaction_type: 'expense' })
        .getRawOne();

      const response: ApiResponse = {
        success: true,
        data: {
          total_balance: totalBalance,
          total_income: parseFloat(totalIncome.total) || 0,
          total_expenses: parseFloat(totalExpenses.total) || 0,
          net_worth: totalBalance,
          account_count: accounts.length,
          balance_by_type: Object.entries(balanceByType).map(([type, data]) => ({
            account_type: type,
            total_balance: data.total_balance,
            account_count: data.account_count,
            accounts: data.accounts
          }))
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

  // Category spending report
  fastify.get('/reports/category-spending', {
    preHandler: authMiddleware
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const authedRequest = request as AuthenticatedRequest;
    try {
      const { start_date, end_date } = request.query as { start_date?: string; end_date?: string };

      // Build query
      const queryBuilder = transactionRepository
        .createQueryBuilder('transaction')
        .leftJoin(Category, 'category', 'category.id = transaction.category_id')
        .where('transaction.user_id = :userId', { userId: authedRequest.user.id })
        .andWhere('transaction.transaction_type = :transaction_type', { transaction_type: 'expense' });

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

      const categorySpending = await queryBuilder
        .select('category.id', 'category_id')
        .addSelect('category.name', 'category_name')
        .addSelect('category.color', 'color')
        .addSelect('category.is_expense', 'is_expense')
        .addSelect('SUM(transaction.amount)', 'total_spent')
        .addSelect('COUNT(transaction.id)', 'transaction_count')
        .addSelect('AVG(transaction.amount)', 'average_amount')
        .groupBy('category.id, category.name, category.color, category.is_expense')
        .orderBy('total_spent', 'DESC')
        .getRawMany();

      const totalSpent = categorySpending.reduce((sum, cat) => sum + parseFloat(cat.total_spent), 0);

      const response: ApiResponse = {
        success: true,
        data: {
          total_spent: totalSpent,
          categories: categorySpending.map(cat => ({
            category_id: cat.category_id,
            category_name: cat.category_name,
            color: cat.color,
            is_expense: cat.is_expense,
            total_spent: parseFloat(cat.total_spent),
            transaction_count: parseInt(cat.transaction_count),
            average_amount: parseFloat(cat.average_amount),
            percentage: totalSpent > 0 ? (parseFloat(cat.total_spent) / totalSpent) * 100 : 0
          }))
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
}
