import {
  userRegistrationSchema,
  userLoginSchema,
  createAccountSchema,
  updateAccountSchema,
  createCategorySchema,
  updateCategorySchema,
  createTransactionSchema,
  updateTransactionSchema,
} from '../../config/validation';

describe('Validation Schemas', () => {
  describe('userRegistrationSchema', () => {
    it('should validate valid user registration data', () => {
      const userData = {
        username: 'testuser123',
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
        language: 'en',
      };

      const { error } = userRegistrationSchema.validate(userData);
      expect(error).toBeUndefined();
    });

    it('should reject invalid username', () => {
      const userData = {
        username: 'invalid user!',
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      };

      const { error } = userRegistrationSchema.validate(userData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('Username must contain only letters, numbers, and underscores');
    });

    it('should reject short username', () => {
      const userData = {
        username: 'ab',
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      };

      const { error } = userRegistrationSchema.validate(userData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('Username must be at least 3 characters long');
    });

    it('should reject invalid email', () => {
      const userData = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      };

      const { error } = userRegistrationSchema.validate(userData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('Please provide a valid email address');
    });

    it('should reject weak password', () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'weak',
        firstName: 'Test',
        lastName: 'User',
      };

      const { error } = userRegistrationSchema.validate(userData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('Password must contain at least 8 characters');
    });

    it('should reject empty first name', () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
        firstName: '',
        lastName: 'User',
      };

      const { error } = userRegistrationSchema.validate(userData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('First name is required');
    });
  });

  describe('userLoginSchema', () => {
    it('should validate valid login data', () => {
      const loginData = {
        username: 'testuser',
        password: 'Password123!',
        deviceInfo: {
          userAgent: 'Mozilla/5.0...',
          ip: '192.168.1.1',
          deviceId: 'device123',
        },
      };

      const { error } = userLoginSchema.validate(loginData);
      expect(error).toBeUndefined();
    });

    it('should reject missing username', () => {
      const loginData = {
        password: 'Password123!',
        deviceInfo: {
          userAgent: 'Mozilla/5.0...',
          ip: '192.168.1.1',
          deviceId: 'device123',
        },
      };

      const { error } = userLoginSchema.validate(loginData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('Username is required');
    });

    it('should reject missing device info', () => {
      const loginData = {
        username: 'testuser',
        password: 'Password123!',
      };

      const { error } = userLoginSchema.validate(loginData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('Device information is required');
    });
  });

  describe('createAccountSchema', () => {
    it('should validate valid account creation data', () => {
      const accountData = {
        name: 'My Savings Account',
        account_type: 'bank_account',
        bank_name: 'Test Bank',
        account_number: '123456789',
        initial_balance: 1000.50,
        currency: 'USD',
      };

      const { error } = createAccountSchema.validate(accountData);
      expect(error).toBeUndefined();
    });

    it('should reject invalid account type', () => {
      const accountData = {
        name: 'My Account',
        account_type: 'invalid_type',
        initial_balance: 1000,
        currency: 'USD',
      };

      const { error } = createAccountSchema.validate(accountData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('must be one of');
    });

    it('should reject negative balance', () => {
      const accountData = {
        name: 'My Account',
        account_type: 'cash',
        initial_balance: -100,
        currency: 'USD',
      };

      const { error } = createAccountSchema.validate(accountData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('must be greater than or equal to 0');
    });

    it('should reject missing currency', () => {
      const accountData = {
        name: 'My Account',
        account_type: 'cash',
        initial_balance: 1000,
      };

      const { error } = createAccountSchema.validate(accountData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('Currency is required');
    });
  });

  describe('createCategorySchema', () => {
    it('should validate valid category creation data', () => {
      const categoryData = {
        name: 'Food & Dining',
        description: 'Restaurants and groceries',
        color: '#FF5733',
        icon: 'restaurant',
        is_expense: true,
      };

      const { error } = createCategorySchema.validate(categoryData);
      expect(error).toBeUndefined();
    });

    it('should reject missing name', () => {
      const categoryData = {
        description: 'Food category',
        color: '#FF5733',
        icon: 'restaurant',
        is_expense: true,
      };

      const { error } = createCategorySchema.validate(categoryData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('Category name is required');
    });

    it('should reject invalid color format', () => {
      const categoryData = {
        name: 'Food',
        color: 'invalid-color',
        icon: 'restaurant',
        is_expense: true,
      };

      const { error } = createCategorySchema.validate(categoryData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('must be a valid color');
    });

    it('should reject missing expense type', () => {
      const categoryData = {
        name: 'Food',
        color: '#FF5733',
        icon: 'restaurant',
      };

      const { error } = createCategorySchema.validate(categoryData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('Category type is required');
    });
  });

  describe('createTransactionSchema', () => {
    it('should validate valid transaction creation data', () => {
      const transactionData = {
        account_id: 1,
        category_id: 1,
        amount: 100.50,
        transaction_type: 'expense',
        description: 'Lunch at restaurant',
        notes: 'Business lunch',
        transaction_date: '2024-01-15',
        transaction_time: '12:30',
        location: 'Bangkok',
        tags: ['food', 'business'],
      };

      const { error } = createTransactionSchema.validate(transactionData);
      expect(error).toBeUndefined();
    });

    it('should reject invalid transaction type', () => {
      const transactionData = {
        account_id: 1,
        category_id: 1,
        amount: 100,
        transaction_type: 'invalid_type',
        description: 'Test transaction',
        transaction_date: '2024-01-15',
      };

      const { error } = createTransactionSchema.validate(transactionData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('must be one of');
    });

    it('should reject zero amount', () => {
      const transactionData = {
        account_id: 1,
        category_id: 1,
        amount: 0,
        transaction_type: 'expense',
        description: 'Test transaction',
        transaction_date: '2024-01-15',
      };

      const { error } = createTransactionSchema.validate(transactionData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('must be greater than 0');
    });

    it('should reject invalid date format', () => {
      const transactionData = {
        account_id: 1,
        category_id: 1,
        amount: 100,
        transaction_type: 'expense',
        description: 'Test transaction',
        transaction_date: 'invalid-date',
      };

      const { error } = createTransactionSchema.validate(transactionData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('must be a valid date');
    });

    it('should reject invalid time format', () => {
      const transactionData = {
        account_id: 1,
        category_id: 1,
        amount: 100,
        transaction_type: 'expense',
        description: 'Test transaction',
        transaction_date: '2024-01-15',
        transaction_time: '25:00', // Invalid time
      };

      const { error } = createTransactionSchema.validate(transactionData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('must be a valid time');
    });

    it('should reject missing required fields', () => {
      const transactionData = {
        amount: 100,
        transaction_type: 'expense',
      };

      const { error } = createTransactionSchema.validate(transactionData);
      expect(error).toBeDefined();
      expect(error?.details.length).toBeGreaterThan(1); // Multiple missing fields
    });
  });

  describe('updateTransactionSchema', () => {
    it('should validate valid transaction update data', () => {
      const updateData = {
        amount: 150.75,
        description: 'Updated description',
        notes: 'Updated notes',
      };

      const { error } = updateTransactionSchema.validate(updateData);
      expect(error).toBeUndefined();
    });

    it('should reject negative amount in update', () => {
      const updateData = {
        amount: -50,
      };

      const { error } = updateTransactionSchema.validate(updateData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('must be greater than 0');
    });

    it('should allow partial updates', () => {
      const updateData = {
        description: 'New description only',
      };

      const { error } = updateTransactionSchema.validate(updateData);
      expect(error).toBeUndefined();
    });
  });

  describe('updateAccountSchema', () => {
    it('should validate valid account update data', () => {
      const updateData = {
        name: 'Updated Account Name',
        current_balance: 1500.75,
        is_active: true,
      };

      const { error } = updateAccountSchema.validate(updateData);
      expect(error).toBeUndefined();
    });

    it('should reject negative balance in update', () => {
      const updateData = {
        current_balance: -100,
      };

      const { error } = updateAccountSchema.validate(updateData);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('must be greater than or equal to 0');
    });
  });

  describe('updateCategorySchema', () => {
    it('should validate valid category update data', () => {
      const updateData = {
        name: 'Updated Category Name',
        description: 'Updated description',
        color: '#00FF00',
        is_active: false,
      };

      const { error } = updateCategorySchema.validate(updateData);
      expect(error).toBeUndefined();
    });

    it('should allow partial updates', () => {
      const updateData = {
        name: 'New name only',
      };

      const { error } = updateCategorySchema.validate(updateData);
      expect(error).toBeUndefined();
    });
  });
});
