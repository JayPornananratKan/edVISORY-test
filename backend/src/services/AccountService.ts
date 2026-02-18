import { Account } from '../entities/Account';
import { AppDataSource } from '../config/database';
import { I18nUtils } from '../utils/i18n';

interface CreateAccountData {
  name: string;
  account_type: string;
  bank_name?: string;
  account_number?: string;
  initial_balance?: number;
  currency?: string;
  userId: number;
}

interface UpdateAccountData {
  name?: string;
  account_type?: string;
  bank_name?: string;
  account_number?: string;
  currency?: string;
  is_active?: boolean;
}

export class AccountService {
  private accountRepository = AppDataSource.getRepository(Account);

  async createAccount(accountData: CreateAccountData) {
    const { name, account_type, bank_name, account_number, initial_balance = 0, currency = 'THB', userId } = accountData;

    // Check if account with same name already exists for this user
    const existingAccount = await this.accountRepository.findOne({
      where: { name, user_id: userId }
    });

    if (existingAccount) {
      throw new Error('Account name already exists');
    }

    // Create account
    const account = this.accountRepository.create({
      name,
      account_type,
      bank_name,
      account_number,
      initial_balance,
      current_balance: initial_balance,
      currency,
      user_id: userId
    });

    await this.accountRepository.save(account);

    return {
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
    };
  }

  async getAccounts(userId: number, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [accounts, total] = await this.accountRepository.findAndCount({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      skip,
      take: limit
    });

    return {
      accounts: accounts.map(account => ({
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
  }

  async getAccountById(accountId: number, userId: number) {
    const account = await this.accountRepository.findOne({
      where: { id: accountId, user_id: userId }
    });

    if (!account) {
      throw new Error('Account not found');
    }

    return {
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
    };
  }

  async updateAccount(accountId: number, userId: number, updateData: UpdateAccountData) {
    const account = await this.accountRepository.findOne({
      where: { id: accountId, user_id: userId }
    });

    if (!account) {
      throw new Error('Account not found');
    }

    // Check if name is being updated and if new name already exists
    if (updateData.name && updateData.name !== account.name) {
      const existingAccount = await this.accountRepository.findOne({
        where: { name: updateData.name, user_id: userId }
      });

      if (existingAccount) {
        throw new Error('Account name already exists');
      }
    }

    // Update account
    Object.assign(account, updateData);
    await this.accountRepository.save(account);

    return {
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
    };
  }

  async deleteAccount(accountId: number, userId: number) {
    const account = await this.accountRepository.findOne({
      where: { id: accountId, user_id: userId }
    });

    if (!account) {
      throw new Error('Account not found');
    }

    // Check if account has transactions (you might want to add this check)
    // For now, we'll allow deletion

    await this.accountRepository.remove(account);

    return {
      message: 'Account deleted successfully'
    };
  }

  async getAccountSummary(userId: number) {
    const accounts = await this.accountRepository.find({
      where: { user_id: userId, is_active: true }
    });

    const totalBalance = accounts.reduce((sum, account) => sum + Number(account.current_balance), 0);
    const accountTypes = [...new Set(accounts.map(account => account.account_type))];

    return {
      total_accounts: accounts.length,
      total_balance: totalBalance,
      account_types: accountTypes,
      accounts_by_type: accountTypes.map(type => ({
        type,
        count: accounts.filter(account => account.account_type === type).length,
        total_balance: accounts
          .filter(account => account.account_type === type)
          .reduce((sum, account) => sum + Number(account.current_balance), 0)
      }))
    };
  }
}
