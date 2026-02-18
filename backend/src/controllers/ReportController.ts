import { FastifyInstance, FastifyReply } from 'fastify';
import { Transaction } from '../entities/Transaction';
import { Account } from '../entities/Account';
import { Category } from '../entities/Category';
import { AppDataSource } from '../config/database';
import { I18nUtils } from '../utils/i18n';
import { ApiResponse, AuthenticatedRequest } from '../types';
import { Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';

export class ReportController {
  private transactionRepository = AppDataSource.getRepository(Transaction);
  private accountRepository = AppDataSource.getRepository(Account);
  private categoryRepository = AppDataSource.getRepository(Category);

  async getTransactionSummary(authedRequest: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { start_date, end_date, group_by = 'month', transaction_type } = authedRequest.query as any;

      let whereCondition: any = { user_id: authedRequest.user.id };

      if (start_date && end_date) {
        whereCondition.transaction_date = Between(new Date(start_date), new Date(end_date));
      } else if (start_date) {
        whereCondition.transaction_date = MoreThanOrEqual(new Date(start_date));
      } else if (end_date) {
        whereCondition.transaction_date = LessThanOrEqual(new Date(end_date));
      }
      if (transaction_type) {
        whereCondition.transaction_type = transaction_type;
      }

      const transactions = await this.transactionRepository.find({
        where: whereCondition,
        order: { transaction_date: 'ASC' }
      });

      // Group transactions based on group_by parameter
      const groupedData: any = {};
      
      transactions.forEach(transaction => {
        let groupKey: string;
        
        switch (group_by) {
          case 'day':
            groupKey = transaction.transaction_date.toISOString().split('T')[0];
            break;
          case 'week':
            const weekStart = new Date(transaction.transaction_date);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            groupKey = weekStart.toISOString().split('T')[0];
            break;
          case 'year':
            groupKey = transaction.transaction_date.getFullYear().toString();
            break;
          case 'month':
          default:
            groupKey = `${transaction.transaction_date.getFullYear()}-${String(transaction.transaction_date.getMonth() + 1).padStart(2, '0')}`;
            break;
        }

        if (!groupedData[groupKey]) {
          groupedData[groupKey] = {
            period: groupKey,
            income: 0,
            expense: 0,
            net: 0,
            transaction_count: 0
          };
        }

        if (transaction.transaction_type === 'income') {
          groupedData[groupKey].income += transaction.amount;
        } else {
          groupedData[groupKey].expense += transaction.amount;
        }
        
        groupedData[groupKey].transaction_count++;
        groupedData[groupKey].net = groupedData[groupKey].income - groupedData[groupKey].expense;
      });

      const response: ApiResponse = {
        success: true,
        data: {
          summary: Object.values(groupedData),
          total_income: Object.values(groupedData).reduce((sum: any, group: any) => sum + group.income, 0),
          total_expense: Object.values(groupedData).reduce((sum: any, group: any) => sum + group.expense, 0),
          total_net: Object.values(groupedData).reduce((sum: any, group: any) => sum + group.net, 0),
          period_type: group_by
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

  async getDailySpending(authedRequest: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { month, year, target_monthly_spending } = authedRequest.query as any;
      
      const targetMonth = parseInt(month) || new Date().getMonth() + 1;
      const targetYear = parseInt(year) || new Date().getFullYear();
      const dailyTarget = target_monthly_spending ? parseFloat(target_monthly_spending) / 30 : null;

      const startDate = new Date(targetYear, targetMonth - 1, 1);
      const endDate = new Date(targetYear, targetMonth, 0);

      const transactions = await this.transactionRepository.find({
        where: {
          user_id: authedRequest.user.id,
          transaction_type: 'expense',
          transaction_date: Between(startDate, endDate)
        },
        order: { transaction_date: 'ASC' }
      });

      // Group by day
      const dailyData: any = {};
      const daysInMonth = endDate.getDate();

      // Initialize all days
      for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        dailyData[dateKey] = {
          date: dateKey,
          spending: 0,
          transaction_count: 0,
          daily_target: dailyTarget,
          variance: dailyTarget ? -dailyTarget : 0
        };
      }

      // Add transactions
      transactions.forEach(transaction => {
        const dateKey = transaction.transaction_date.toISOString().split('T')[0];
        if (dailyData[dateKey]) {
          dailyData[dateKey].spending += transaction.amount;
          dailyData[dateKey].transaction_count++;
          if (dailyTarget) {
            dailyData[dateKey].variance = dailyTarget - dailyData[dateKey].spending;
          }
        }
      });

      // Calculate cumulative spending
      let cumulativeSpending = 0;
      Object.values(dailyData).forEach((day: any) => {
        cumulativeSpending += day.spending;
        day.cumulative_spending = cumulativeSpending;
        day.cumulative_target = dailyTarget ? (day.cumulative_target || 0) + dailyTarget : null;
        day.cumulative_variance = day.cumulative_target ? day.cumulative_target - cumulativeSpending : null;
      });

      const totalSpending = Object.values(dailyData).reduce((sum: number, day: any) => sum + day.spending, 0);
      const averageDailySpending = totalSpending / daysInMonth;

      const response: ApiResponse = {
        success: true,
        data: {
          daily_breakdown: Object.values(dailyData),
          summary: {
            total_spending: totalSpending,
            average_daily_spending: averageDailySpending,
            daily_target: dailyTarget,
            monthly_target: target_monthly_spending ? parseFloat(target_monthly_spending) : null,
            variance: target_monthly_spending ? parseFloat(target_monthly_spending) - totalSpending : null,
            days_in_month: daysInMonth
          }
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

  async getAccountSummary(authedRequest: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const accounts = await this.accountRepository.find({
        where: { user_id: authedRequest.user.id, is_active: true }
      });

      const accountSummaries = await Promise.all(
        accounts.map(async (account) => {
          // Get recent transactions for this account
          const recentTransactions = await this.transactionRepository.find({
            where: { account_id: account.id },
            order: { transaction_date: 'DESC' },
            take: 5
          });

          // Calculate monthly change
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
          
          const monthlyTransactions = await this.transactionRepository.find({
            where: {
              account_id: account.id,
              transaction_date: MoreThanOrEqual(oneMonthAgo)
            }
          });

          const monthlyIncome = monthlyTransactions
            .filter(t => t.transaction_type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
          
          const monthlyExpense = monthlyTransactions
            .filter(t => t.transaction_type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

          return {
            id: account.id,
            name: account.name,
            account_type: account.account_type,
            bank_name: account.bank_name,
            current_balance: account.current_balance,
            initial_balance: account.initial_balance,
            currency: account.currency,
            monthly_income: monthlyIncome,
            monthly_expense: monthlyExpense,
            monthly_change: monthlyIncome - monthlyExpense,
            recent_transactions: recentTransactions.map(t => ({
              id: t.id,
              amount: t.amount,
              transaction_type: t.transaction_type,
              description: t.description,
              transaction_date: t.transaction_date
            }))
          };
        })
      );

      const totalBalance = accountSummaries.reduce((sum, account) => sum + account.current_balance, 0);
      const totalMonthlyIncome = accountSummaries.reduce((sum, account) => sum + account.monthly_income, 0);
      const totalMonthlyExpense = accountSummaries.reduce((sum, account) => sum + account.monthly_expense, 0);

      const response: ApiResponse = {
        success: true,
        data: {
          accounts: accountSummaries,
          summary: {
            total_balance: totalBalance,
            total_monthly_income: totalMonthlyIncome,
            total_monthly_expense: totalMonthlyExpense,
            total_monthly_change: totalMonthlyIncome - totalMonthlyExpense
          }
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

  async getCategorySpending(authedRequest: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { start_date, end_date, transaction_type = 'expense' } = authedRequest.query as any;

      let whereCondition: any = {
        user_id: authedRequest.user.id,
        transaction_type
      };

      if (start_date && end_date) {
        whereCondition.transaction_date = Between(new Date(start_date), new Date(end_date));
      } else if (start_date) {
        whereCondition.transaction_date = MoreThanOrEqual(new Date(start_date));
      } else if (end_date) {
        whereCondition.transaction_date = LessThanOrEqual(new Date(end_date));
      }

      const transactions = await this.transactionRepository.find({
        where: whereCondition,
        relations: ['category']
      });

      // Group by category
      const categoryData: any = {};
      
      transactions.forEach(transaction => {
        const categoryId = transaction.category_id;
        
        if (!categoryData[categoryId]) {
          categoryData[categoryId] = {
            category_id: categoryId,
            category_name: (transaction.category as any)?.name || 'Unknown',
            total_amount: 0,
            transaction_count: 0,
            average_amount: 0
          };
        }

        categoryData[categoryId].total_amount += transaction.amount;
        categoryData[categoryId].transaction_count++;
      });

      // Calculate averages
      Object.values(categoryData).forEach((category: any) => {
        category.average_amount = category.transaction_count > 0 ? category.total_amount / category.transaction_count : 0;
      });

      // Sort by total amount
      const sortedCategories = Object.values(categoryData).sort((a: any, b: any) => b.total_amount - a.total_amount);

      const totalAmount = Object.values(categoryData).reduce((sum: number, category: any) => sum + category.total_amount, 0);

      const response: ApiResponse = {
        success: true,
        data: {
          categories: sortedCategories,
          summary: {
            total_amount: totalAmount,
            category_count: sortedCategories.length,
            average_per_category: sortedCategories.length > 0 ? totalAmount / sortedCategories.length : 0
          }
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
}
