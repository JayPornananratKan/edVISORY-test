import { Transaction } from '../entities/Transaction';
import { Account } from '../entities/Account';
import { Category } from '../entities/Category';
import { AppDataSource } from '../config/database';
import { I18nUtils } from '../utils/i18n';
import { Between, MoreThanOrEqual, LessThanOrEqual, In } from 'typeorm';

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

export class ReportService {
  private transactionRepository = AppDataSource.getRepository(Transaction);
  private accountRepository = AppDataSource.getRepository(Account);
  private categoryRepository = AppDataSource.getRepository(Category);

  async getTransactionSummary(userId: number, query: TransactionSummaryQuery) {
    const { start_date, end_date, account_id, category_id, transaction_type, group_by = 'month' } = query;

    // Build where clause
    const whereClause: any = { user_id: userId };
    if (account_id) whereClause.account_id = account_id;
    if (category_id) whereClause.category_id = category_id;
    if (transaction_type) whereClause.transaction_type = transaction_type;
    
    if (start_date || end_date) {
      if (start_date && end_date) {
        whereClause.transaction_date = Between(new Date(start_date), new Date(end_date));
      } else if (start_date) {
        whereClause.transaction_date = MoreThanOrEqual(new Date(start_date));
      } else if (end_date) {
        whereClause.transaction_date = LessThanOrEqual(new Date(end_date));
      }
    }

    const transactions = await this.transactionRepository.find({
      where: whereClause,
      order: { transaction_date: 'ASC' }
    });

    // Group transactions by specified period
    const groupedData = this.groupTransactionsByPeriod(transactions, group_by);

    // Calculate category breakdown
    const categoryBreakdown = this.calculateCategoryBreakdown(transactions);

    return {
      summary: {
        total_transactions: transactions.length,
        total_income: transactions.filter(t => t.transaction_type === 'income').reduce((sum, t) => sum + Number(t.amount), 0),
        total_expense: transactions.filter(t => t.transaction_type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0),
        net_amount: 0,
        period: group_by
      },
      grouped_data: groupedData,
      category_breakdown: categoryBreakdown
    };
  }

  async getDailySpendingAnalysis(userId: number, query: DailySpendingQuery) {
    const { month, year, target_monthly_spending } = query;

    // Get transactions for the specified month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of the month

    const transactions = await this.transactionRepository.find({
      where: {
        user_id: userId,
        transaction_type: 'expense',
        transaction_date: Between(startDate, endDate)
      },
      order: { transaction_date: 'ASC' }
    });

    const totalSpent = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const daysInMonth = endDate.getDate();
    const currentDay = new Date().getDate();
    const daysRemaining = daysInMonth - currentDay;
    const daysPassed = currentDay;

    const dailyAverage = totalSpent / daysPassed;
    const recommendedDailySpending = target_monthly_spending ? target_monthly_spending / daysInMonth : 0;
    const dailyAllowance = target_monthly_spending ? (target_monthly_spending - totalSpent) / daysRemaining : 0;

    let status: 'on_track' | 'over_budget' | 'under_budget' = 'on_track';
    if (target_monthly_spending) {
      if (totalSpent > target_monthly_spending) {
        status = 'over_budget';
      } else if (dailyAverage > recommendedDailySpending * 1.2) {
        status = 'over_budget';
      } else if (dailyAverage < recommendedDailySpending * 0.8) {
        status = 'under_budget';
      }
    }

    return {
      month,
      year,
      days_in_month: daysInMonth,
      days_passed: daysPassed,
      days_remaining: daysRemaining,
      current_month_spending: totalSpent,
      target_monthly_spending,
      daily_average_spending: dailyAverage,
      daily_allowance: dailyAllowance,
      recommended_daily_spending: recommendedDailySpending,
      status,
      daily_spending_data: this.calculateDailySpendingData(transactions, daysInMonth)
    };
  }

  async getAccountSummary(userId: number) {
    const accounts = await this.accountRepository.find({
      where: { user_id: userId, is_active: true }
    });

    const accountSummaries = await Promise.all(
      accounts.map(async (account) => {
        const transactions = await this.transactionRepository.find({
          where: { account_id: account.id }
        });

        const totalIncome = transactions
          .filter(t => t.transaction_type === 'income')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const totalExpense = transactions
          .filter(t => t.transaction_type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        return {
          id: account.id,
          name: account.name,
          account_type: account.account_type,
          current_balance: account.current_balance,
          total_income: totalIncome,
          total_expense: totalExpense,
          net_amount: totalIncome - totalExpense,
          transaction_count: transactions.length
        };
      })
    );

    return {
      accounts: accountSummaries,
      total_accounts: accounts.length,
      total_balance: accounts.reduce((sum, acc) => sum + Number(acc.current_balance), 0),
      total_income: accountSummaries.reduce((sum, acc) => sum + acc.total_income, 0),
      total_expense: accountSummaries.reduce((sum, acc) => sum + acc.total_expense, 0)
    };
  }

  async getCategorySpending(userId: number, query: any = {}) {
    const { start_date, end_date, transaction_type = 'expense' } = query;

    const whereClause: any = { user_id: userId, transaction_type };
    if (start_date || end_date) {
      if (start_date && end_date) {
        whereClause.transaction_date = Between(new Date(start_date), new Date(end_date));
      } else if (start_date) {
        whereClause.transaction_date = MoreThanOrEqual(new Date(start_date));
      } else if (end_date) {
        whereClause.transaction_date = LessThanOrEqual(new Date(end_date));
      }
    }

    const transactions = await this.transactionRepository.find({
      where: whereClause
    });

    // Group by category
    const categoryMap = new Map();
    
    transactions.forEach(transaction => {
      const categoryId = transaction.category_id;
      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          category_id: categoryId,
          total_amount: 0,
          transaction_count: 0,
          transactions: []
        });
      }
      
      const category = categoryMap.get(categoryId);
      category.total_amount += Number(transaction.amount);
      category.transaction_count += 1;
      category.transactions.push({
        id: transaction.id,
        amount: transaction.amount,
        description: transaction.description,
        transaction_date: transaction.transaction_date
      });
    });

    // Get category details
    const categoryIds = Array.from(categoryMap.keys());
    const categories = await this.categoryRepository.find({
      where: { id: In(categoryIds) }
    });

    const categoryDetails = new Map();
    categories.forEach(cat => {
      categoryDetails.set(cat.id, {
        name: cat.name,
        color: cat.color,
        icon: cat.icon,
        is_expense: cat.is_expense
      });
    });

    // Build final result
    const result = Array.from(categoryMap.values()).map(cat => {
      const details = categoryDetails.get(cat.category_id) || {};
      return {
        ...cat,
        category_name: details.name || 'Unknown',
        color: details.color || '#000000',
        icon: details.icon || 'default',
        is_expense: details.is_expense || true,
        average_amount: cat.total_amount / cat.transaction_count
      };
    });

    // Sort by total amount descending
    result.sort((a, b) => b.total_amount - a.total_amount);

    return {
      categories: result,
      total_amount: result.reduce((sum, cat) => sum + cat.total_amount, 0),
      total_transactions: result.reduce((sum, cat) => sum + cat.transaction_count, 0)
    };
  }

  private groupTransactionsByPeriod(transactions: any[], groupBy: string) {
    const grouped = new Map();

    transactions.forEach(transaction => {
      let key: string;
      const date = new Date(transaction.transaction_date);

      switch (groupBy) {
        case 'day':
          key = date.toISOString().split('T')[0]; // YYYY-MM-DD
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'year':
          key = date.getFullYear().toString();
          break;
        default:
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!grouped.has(key)) {
        grouped.set(key, {
          period: key,
          total_income: 0,
          total_expense: 0,
          net_amount: 0,
          transaction_count: 0
        });
      }

      const period = grouped.get(key);
      period.transaction_count += 1;
      
      if (transaction.transaction_type === 'income') {
        period.total_income += Number(transaction.amount);
      } else if (transaction.transaction_type === 'expense') {
        period.total_expense += Number(transaction.amount);
      }
      
      period.net_amount = period.total_income - period.total_expense;
    });

    return Array.from(grouped.values()).sort((a, b) => a.period.localeCompare(b.period));
  }

  private calculateCategoryBreakdown(transactions: any[]) {
    const categoryMap = new Map();

    transactions.forEach(transaction => {
      const categoryId = transaction.category_id;
      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          category_id: categoryId,
          amount: 0,
          count: 0
        });
      }
      
      const category = categoryMap.get(categoryId);
      category.amount += Number(transaction.amount);
      category.count += 1;
    });

    const total = Array.from(categoryMap.values()).reduce((sum, cat) => sum + cat.amount, 0);

    return Array.from(categoryMap.values()).map(cat => ({
      category_id: cat.category_id,
      amount: cat.amount,
      count: cat.count,
      percentage: total > 0 ? (cat.amount / total) * 100 : 0
    }));
  }

  private calculateDailySpendingData(transactions: any[], daysInMonth: number) {
    const dailyData = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dayTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.transaction_date);
        return transactionDate.getDate() === day;
      });
      
      const dayTotal = dayTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
      
      dailyData.push({
        day,
        amount: dayTotal,
        transaction_count: dayTransactions.length
      });
    }
    
    return dailyData;
  }
}
