import { TransactionService } from '../../services/TransactionService';
import { Transaction } from '../../entities/Transaction';
import { Account } from '../../entities/Account';
import { Category } from '../../entities/Category';
import { TransactionAttachment } from '../../entities/TransactionAttachment';

// Mock the dependencies - Updated to fix circular reference
jest.mock('../../config/database');
jest.mock('../../utils/i18n');
jest.mock('../../utils/profanity-filter');

const mockTransactionRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  findAndCount: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(),
};

const mockAttachmentRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  delete: jest.fn(),
};

const mockAccountRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
};

const mockCategoryRepository = {
  findOne: jest.fn(),
};

jest.mock('../../config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn().mockImplementation((entity) => {
      if (entity === Transaction) return mockTransactionRepository;
      if (entity === TransactionAttachment) return mockAttachmentRepository;
      if (entity === Account) return mockAccountRepository;
      if (entity === Category) return mockCategoryRepository;
      return {};
    }),
  },
}));

describe('TransactionService', () => {
  let transactionService: TransactionService;

  beforeEach(() => {
    jest.clearAllMocks();
    transactionService = new TransactionService();
  });

  describe('createTransaction', () => {
    it('should create a transaction successfully', async () => {
      const transactionData = {
        account_id: 1,
        category_id: 1,
        amount: 100,
        transaction_type: 'expense' as const,
        description: 'Test transaction',
        notes: 'Test notes',
        transaction_date: '2024-01-15',
        userId: 1,
      };

      const mockAccount = { id: 1, user_id: 1, current_balance: 1000 };
      const mockCategory = { id: 1, user_id: 1, is_expense: true };
      const mockTransaction = {
        id: 1,
        user_id: transactionData.userId,
        account_id: transactionData.account_id,
        category_id: transactionData.category_id,
        amount: transactionData.amount,
        transaction_type: transactionData.transaction_type,
        description: transactionData.description,
        notes: transactionData.notes,
        transaction_date: new Date(transactionData.transaction_date),
        transaction_time: '17:39',
        location: undefined,
        tags: [],
        is_recurring: false,
        recurring_pattern: undefined,
        recurring_end_date: undefined,
        reference_number: undefined,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockAccountRepository.findOne.mockResolvedValue(mockAccount);
      mockCategoryRepository.findOne.mockResolvedValue(mockCategory);
      mockTransactionRepository.create.mockReturnValue(mockTransaction);
      mockTransactionRepository.save.mockResolvedValue(mockTransaction);

      const result = await transactionService.createTransaction(transactionData);

      expect(mockAccountRepository.findOne).toHaveBeenCalledWith({
        where: { id: transactionData.account_id, user_id: transactionData.userId }
      });
      expect(mockCategoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: transactionData.category_id, user_id: transactionData.userId }
      });
      expect(mockTransactionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: transactionData.userId,
          account_id: transactionData.account_id,
          category_id: transactionData.category_id,
          amount: transactionData.amount,
          transaction_type: transactionData.transaction_type,
          description: 'Test transaction',
          notes: 'Test notes',
          transaction_date: expect.any(Date),
          tags: [],
          is_recurring: false,
        })
      );
      expect(result).toEqual({
        id: 1,
        user_id: transactionData.userId,
        account_id: transactionData.account_id,
        category_id: transactionData.category_id,
        amount: transactionData.amount,
        transaction_type: transactionData.transaction_type,
        description: transactionData.description,
        notes: transactionData.notes,
        transaction_date: expect.any(Date),
        transaction_time: '17:39',
        location: undefined,
        tags: [],
        is_recurring: false,
        recurring_pattern: undefined,
        recurring_end_date: undefined,
        reference_number: undefined,
        created_at: expect.any(Date),
      });
    });

    it('should throw error if account not found', async () => {
      const transactionData = {
        account_id: 999,
        category_id: 1,
        amount: 100,
        transaction_type: 'expense' as const,
        description: 'Test transaction',
        transaction_date: '2024-01-15',
        userId: 1,
      };

      mockAccountRepository.findOne.mockResolvedValue(null);

      await expect(transactionService.createTransaction(transactionData)).rejects.toThrow('Account not found');
    });

    it('should throw error if category not found', async () => {
      const transactionData = {
        account_id: 1,
        category_id: 999,
        amount: 100,
        transaction_type: 'expense' as const,
        description: 'Test transaction',
        transaction_date: '2024-01-15',
        userId: 1,
      };

      mockAccountRepository.findOne.mockResolvedValue({ id: 1, user_id: 1 });
      mockCategoryRepository.findOne.mockResolvedValue(null);

      await expect(transactionService.createTransaction(transactionData)).rejects.toThrow('Category not found');
    });
  });

  describe('getTransactions', () => {
    it('should get transactions with pagination', async () => {
      const userId = 1;
      const filters = {
        page: 1,
        limit: 20,
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        transaction_type: 'expense',
      };

      const mockTransactions = [
        { id: 1, description: 'Transaction 1', amount: 100 },
        { id: 2, description: 'Transaction 2', amount: 200 },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockTransactions, 2]),
      };

      mockTransactionRepository.findAndCount = jest.fn().mockResolvedValue([mockTransactions, 2]);

      const result = await transactionService.getTransactions(userId, filters);

      expect(mockTransactionRepository.findAndCount).toHaveBeenCalledWith({
        where: expect.objectContaining({
          user_id: userId,
          transaction_type: 'expense',
        }),
        order: { created_at: 'DESC' },
        skip: 0,
        take: 20,
        relations: ['account', 'category']
      });
      expect(result.transactions).toEqual(mockTransactions);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });
    });

    it('should handle empty results', async () => {
      const userId = 1;
      const filters = { page: 1, limit: 20 };

      mockTransactionRepository.findAndCount = jest.fn().mockResolvedValue([[], 0]);

      const result = await transactionService.getTransactions(userId, filters);

      expect(result.transactions).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('getTransactionById', () => {
    it('should get transaction by ID', async () => {
      const transactionId = 1;
      const userId = 1;
      const mockTransaction = {
        id: transactionId,
        description: 'Test transaction',
        amount: 100,
        user_id: userId,
      };
      const mockAttachments: TransactionAttachment[] = [];

      mockTransactionRepository.findOne.mockResolvedValue(mockTransaction);
      mockAttachmentRepository.find.mockResolvedValue(mockAttachments);

      const result = await transactionService.getTransactionById(transactionId, userId);

      expect(mockTransactionRepository.findOne).toHaveBeenCalledWith({
        where: { id: transactionId, user_id: userId },
        relations: ['account', 'category']
      });
      expect(result).toEqual(expect.objectContaining({
        id: transactionId,
        description: 'Test transaction',
        amount: 100,
        attachments: []
      }));
    });

    it('should throw error if transaction not found', async () => {
      const transactionId = 999;
      const userId = 1;

      mockTransactionRepository.findOne.mockResolvedValue(null);

      await expect(transactionService.getTransactionById(transactionId, userId)).rejects.toThrow('Transaction not found');
    });
  });

  describe('updateTransaction', () => {
    it('should update transaction successfully', async () => {
      const transactionId = 1;
      const userId = 1;
      const updateData = {
        description: 'Updated description',
        amount: 150,
      };

      const existingTransaction = {
        id: transactionId,
        description: 'Original description',
        amount: 100,
        user_id: userId,
        account_id: 1,
        category_id: 1,
        transaction_type: 'expense',
        notes: undefined,
        transaction_date: new Date(),
        transaction_time: '10:00',
        location: undefined,
        tags: [],
        is_recurring: false,
        recurring_pattern: undefined,
        recurring_end_date: undefined,
        reference_number: undefined,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const updatedTransaction = {
        ...existingTransaction,
        description: 'Updated description',
        amount: 150,
        updated_at: new Date(),
      };

      mockTransactionRepository.findOne.mockResolvedValue(existingTransaction);
      mockTransactionRepository.save.mockResolvedValue(updatedTransaction);

      const result = await transactionService.updateTransaction(transactionId, userId, updateData);

      expect(mockTransactionRepository.findOne).toHaveBeenCalledWith({
        where: { id: transactionId, user_id: userId }
      });
      expect(result).toEqual({
        id: transactionId,
        description: 'Updated description',
        amount: 150,
        user_id: userId,
        account_id: 1,
        category_id: 1,
        transaction_type: 'expense',
        notes: undefined,
        transaction_date: expect.any(Date),
        transaction_time: '10:00',
        location: undefined,
        tags: [],
        is_recurring: false,
        recurring_pattern: undefined,
        recurring_end_date: undefined,
        reference_number: undefined,
        created_at: expect.any(Date),
        updated_at: expect.any(Date),
      });
    });

    it('should throw error if transaction not found', async () => {
      const transactionId = 999;
      const userId = 1;
      const updateData = { description: 'Updated description' };

      mockTransactionRepository.findOne.mockResolvedValue(null);

      await expect(transactionService.updateTransaction(transactionId, userId, updateData)).rejects.toThrow('Transaction not found');
    });
  });

  describe('deleteTransaction', () => {
    it('should delete transaction successfully', async () => {
      const transactionId = 1;
      const userId = 1;
      const mockTransaction = {
        id: transactionId,
        description: 'Test transaction',
        user_id: userId,
        account_id: 1,
        amount: 100,
        transaction_type: 'expense',
      };
      const mockAccount = {
        id: 1,
        user_id: userId,
        current_balance: 1000,
      };

      mockTransactionRepository.findOne.mockResolvedValue(mockTransaction);
      mockAccountRepository.findOne.mockResolvedValue(mockAccount);
      mockAccountRepository.save.mockResolvedValue(mockAccount);
      mockAttachmentRepository.delete.mockResolvedValue({ affected: 0 });
      mockTransactionRepository.remove.mockResolvedValue(mockTransaction);

      const result = await transactionService.deleteTransaction(transactionId, userId);

      expect(mockTransactionRepository.findOne).toHaveBeenCalledWith({
        where: { id: transactionId, user_id: userId }
      });
      expect(mockTransactionRepository.remove).toHaveBeenCalledWith(mockTransaction);
      expect(result).toEqual({ message: 'Transaction deleted successfully' });
    });

    it('should throw error if transaction not found', async () => {
      const transactionId = 999;
      const userId = 1;

      mockTransactionRepository.findOne.mockResolvedValue(null);

      await expect(transactionService.deleteTransaction(transactionId, userId)).rejects.toThrow('Transaction not found');
    });
  });

  describe('getTransactionSummary', () => {
    it('should get transaction summary', async () => {
      const userId = 1;
      const filters = {
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        transaction_type: 'expense',
      };

      const mockTransactions = [
        { id: 1, amount: 100, transaction_type: 'expense' },
        { id: 2, amount: 200, transaction_type: 'expense' },
        { id: 3, amount: 300, transaction_type: 'income' },
      ];

      mockTransactionRepository.find.mockResolvedValue(mockTransactions);

      const result = await transactionService.getTransactionSummary(userId, filters);

      expect(mockTransactionRepository.find).toHaveBeenCalledWith({
        where: expect.objectContaining({
          user_id: userId,
          transaction_type: 'expense',
        })
      });
      expect(result.total_expense).toBe(300);
      expect(result.total_income).toBe(300);
      expect(result.net_amount).toBe(0);
      expect(result.total_transactions).toBe(3);
    });
  });
});
