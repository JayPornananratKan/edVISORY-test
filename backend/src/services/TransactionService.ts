import { Transaction } from '../entities/Transaction';
import { Account } from '../entities/Account';
import { Category } from '../entities/Category';
import { TransactionAttachment } from '../entities/TransactionAttachment';
import { AppDataSource } from '../config/database';
import { I18nUtils } from '../utils/i18n';
import { ProfanityFilter } from '../utils/profanity-filter';
import { Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

interface CreateTransactionData {
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
  userId: number;
}

interface UpdateTransactionData {
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

export class TransactionService {
  private transactionRepository = AppDataSource.getRepository(Transaction);
  private attachmentRepository = AppDataSource.getRepository(TransactionAttachment);
  private accountRepository = AppDataSource.getRepository(Account);
  private categoryRepository = AppDataSource.getRepository(Category);

  async createTransaction(transactionData: CreateTransactionData) {
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
      reference_number,
      userId
    } = transactionData;

    // Verify account belongs to user
    const account = await this.accountRepository.findOne({
      where: { id: account_id, user_id: userId }
    });

    if (!account) {
      throw new Error('Account not found');
    }

    // Verify category belongs to user
    const category = await this.categoryRepository.findOne({
      where: { id: category_id, user_id: userId }
    });

    if (!category) {
      throw new Error('Category not found');
    }

    // Filter profanity in description and notes
    const filteredDescription = description ? ProfanityFilter.filter(description) : undefined;
    const filteredNotes = notes ? ProfanityFilter.filter(notes) : undefined;

    const transaction = this.transactionRepository.create({
      user_id: userId,
      account_id,
      category_id,
      amount,
      transaction_type,
      description: filteredDescription,
      notes: filteredNotes,
      transaction_date: new Date(transaction_date),
      transaction_time: transaction_time || new Date().toTimeString().split(' ')[0].substring(0, 5),
      location,
      tags: tags || [],
      is_recurring: is_recurring || false,
      recurring_pattern,
      recurring_end_date: recurring_end_date ? new Date(recurring_end_date) : undefined,
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

    return {
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
      recurring_end_date: transaction.recurring_end_date,
      reference_number: transaction.reference_number,
      created_at: transaction.created_at
    };
  }

  async getTransactions(userId: number, filters: any = {}, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const whereClause: any = { user_id: userId };

    // Apply filters
    if (filters.account_id) whereClause.account_id = filters.account_id;
    if (filters.category_id) whereClause.category_id = filters.category_id;
    if (filters.transaction_type) whereClause.transaction_type = filters.transaction_type;
    if (filters.start_date || filters.end_date) {
      if (filters.start_date && filters.end_date) {
        whereClause.transaction_date = Between(new Date(filters.start_date), new Date(filters.end_date));
      } else if (filters.start_date) {
        whereClause.transaction_date = MoreThanOrEqual(new Date(filters.start_date));
      } else if (filters.end_date) {
        whereClause.transaction_date = LessThanOrEqual(new Date(filters.end_date));
      }
    }

    const [transactions, total] = await this.transactionRepository.findAndCount({
      where: whereClause,
      order: { created_at: 'DESC' },
      skip,
      take: limit,
      relations: ['account', 'category']
    });

    return {
      transactions: transactions.map(transaction => ({
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
        recurring_end_date: transaction.recurring_end_date,
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
  }

  async getTransactionById(transactionId: number, userId: number) {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId, user_id: userId },
      relations: ['account', 'category']
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Get attachments
    const attachments = await this.attachmentRepository.find({
      where: { transaction_id: transactionId }
    });

    return {
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
      recurring_end_date: transaction.recurring_end_date,
      reference_number: transaction.reference_number,
      attachments: attachments.map(att => ({
        id: att.id,
        file_name: att.file_name,
        original_name: att.original_name,
        file_path: att.file_path,
        file_size: att.file_size,
        mime_type: att.mime_type,
        uploaded_at: att.uploaded_at
      })),
      created_at: transaction.created_at,
      updated_at: transaction.updated_at
    };
  }

  async updateTransaction(transactionId: number, userId: number, updateData: UpdateTransactionData) {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId, user_id: userId }
    });

    if (!transaction) {
      throw new Error('Transaction not found');
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

    if (updateData.account_id !== undefined) {
      // Verify new account belongs to user
      const newAccount = await this.accountRepository.findOne({
        where: { id: updateData.account_id, user_id: userId }
      });

      if (!newAccount) {
        throw new Error('Account not found');
      }

      transaction.account_id = updateData.account_id;
      newAccountId = updateData.account_id;
      balanceUpdateNeeded = true;
    }

    if (updateData.category_id !== undefined) {
      // Verify new category belongs to user
      const newCategory = await this.categoryRepository.findOne({
        where: { id: updateData.category_id, user_id: userId }
      });

      if (!newCategory) {
        throw new Error('Category not found');
      }

      transaction.category_id = updateData.category_id;
    }

    if (updateData.amount !== undefined) {
      transaction.amount = updateData.amount;
      newAmount = updateData.amount;
      balanceUpdateNeeded = true;
    }

    // Filter profanity in description and notes if they're being updated
    const filteredUpdateData = { ...updateData };
    if (updateData.description) {
      filteredUpdateData.description = ProfanityFilter.filter(updateData.description);
    }
    if (updateData.notes) {
      filteredUpdateData.notes = ProfanityFilter.filter(updateData.notes);
    }

    // Update other fields
    if (updateData.description) transaction.description = filteredUpdateData.description!;
    if (updateData.notes) transaction.notes = filteredUpdateData.notes!;
    if (updateData.transaction_date) transaction.transaction_date = new Date(updateData.transaction_date);
    if (updateData.transaction_time) transaction.transaction_time = new Date(`1970-01-01T${updateData.transaction_time}`);
    if (updateData.location) transaction.location = updateData.location;
    if (updateData.tags) transaction.tags = updateData.tags;
    if (updateData.is_recurring !== undefined) transaction.is_recurring = updateData.is_recurring;
    if (updateData.recurring_pattern) transaction.recurring_pattern = updateData.recurring_pattern;
    if (updateData.recurring_end_date) transaction.recurring_end_date = new Date(updateData.recurring_end_date);
    if (updateData.reference_number) transaction.reference_number = updateData.reference_number;

    await this.transactionRepository.save(transaction);

    // Update account balances if needed
    if (balanceUpdateNeeded) {
      // Revert original transaction from original account
      const originalAccount = await this.accountRepository.findOne({
        where: { id: originalAccountId, user_id: userId }
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
        where: { id: newAccountId, user_id: userId }
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

    return {
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
      recurring_end_date: transaction.recurring_end_date,
      reference_number: transaction.reference_number,
      created_at: transaction.created_at,
      updated_at: transaction.updated_at
    };
  }

  async deleteTransaction(transactionId: number, userId: number) {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId, user_id: userId }
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Update account balance
    const account = await this.accountRepository.findOne({
      where: { id: transaction.account_id, user_id: userId }
    });

    if (account) {
      if (transaction.transaction_type === 'income') {
        account.current_balance -= transaction.amount;
      } else {
        account.current_balance += transaction.amount;
      }
      await this.accountRepository.save(account);
    }

    // Delete attachments first
    await this.attachmentRepository.delete({ transaction_id: transactionId });

    // Delete transaction
    await this.transactionRepository.remove(transaction);

    return {
      message: 'Transaction deleted successfully'
    };
  }

  async getTransactionSummary(userId: number, filters: any = {}) {
    const whereClause: any = { user_id: userId };

    // Apply filters
    if (filters.account_id) whereClause.account_id = filters.account_id;
    if (filters.category_id) whereClause.category_id = filters.category_id;
    if (filters.transaction_type) whereClause.transaction_type = filters.transaction_type;
    if (filters.start_date || filters.end_date) {
      if (filters.start_date && filters.end_date) {
        whereClause.transaction_date = Between(new Date(filters.start_date), new Date(filters.end_date));
      } else if (filters.start_date) {
        whereClause.transaction_date = MoreThanOrEqual(new Date(filters.start_date));
      } else if (filters.end_date) {
        whereClause.transaction_date = LessThanOrEqual(new Date(filters.end_date));
      }
    }

    const transactions = await this.transactionRepository.find({
      where: whereClause
    });

    const totalIncome = transactions
      .filter(t => t.transaction_type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpense = transactions
      .filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalTransfers = transactions
      .filter(t => t.transaction_type === 'transfer')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      total_transactions: transactions.length,
      total_income: totalIncome,
      total_expense: totalExpense,
      total_transfers: totalTransfers,
      net_amount: totalIncome - totalExpense,
      average_transaction: transactions.length > 0 ? (totalIncome + totalExpense) / transactions.length : 0
    };
  }

  async addAttachment(transactionId: number, userId: number, attachmentData: any) {
    // Verify transaction belongs to user
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId, user_id: userId }
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads', 'attachments');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const fileExtension = path.extname(attachmentData.filename || '');
    const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(2)}${fileExtension}`;
    const filePath = path.join(uploadsDir, uniqueFilename);

    // Create attachment record with proper file mapping
    const attachment = new TransactionAttachment();
    attachment.transaction_id = transactionId;
    attachment.file_name = uniqueFilename;
    attachment.original_name = attachmentData.filename || 'unknown';
    attachment.file_path = filePath;
    attachment.file_size = 0; // Will be updated if file exists
    attachment.mime_type = attachmentData.mimetype || 'application/octet-stream';

    // Save file to disk
    if (attachmentData.file) {
      // Convert FileStream to Buffer
      const chunks: Buffer[] = [];
      for await (const chunk of attachmentData.file) {
        chunks.push(chunk);
      }
      const fileBuffer = Buffer.concat(chunks);
      await fs.promises.writeFile(filePath, fileBuffer);
      
      // Update file size with actual buffer length
      attachment.file_size = fileBuffer.length;
      
      // Generate file hash for integrity
      const crypto = require('crypto');
      attachment.file_hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    }

    await this.attachmentRepository.save(attachment);

    return {
      id: attachment.id,
      file_name: attachment.file_name,
      original_name: attachment.original_name,
      file_path: attachment.file_path,
      file_size: attachment.file_size,
      mime_type: attachment.mime_type,
      uploaded_at: attachment.uploaded_at
    };
  }

  async removeAttachment(attachmentId: number, userId: number) {
    const attachment = await this.attachmentRepository.findOne({
      where: { id: attachmentId }
    });

    if (!attachment) {
      throw new Error('Attachment not found');
    }

    // Verify transaction belongs to user
    const transaction = await this.transactionRepository.findOne({
      where: { id: attachment.transaction_id, user_id: userId }
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    await this.attachmentRepository.remove(attachment);

    return {
      message: 'Attachment removed successfully'
    };
  }
}
