import Joi from 'joi';

// Common validation patterns
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const usernamePattern = /^[a-zA-Z0-9_]+$/;
const decimalPattern = /^\d+(\.\d{1,2})?$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

// User validation schemas
export const userRegistrationSchema = Joi.object({
  username: Joi.string()
    .pattern(usernamePattern)
    .min(3)
    .max(50)
    .required()
    .messages({
      'string.pattern.base': 'Username must contain only letters, numbers, and underscores',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username must not exceed 50 characters',
      'any.required': 'Username is required'
    }),
  email: Joi.string()
    .pattern(emailPattern)
    .email()
    .required()
    .messages({
      'string.pattern.base': 'Please provide a valid email address',
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .pattern(passwordPattern)
    .min(8)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character',
      'string.min': 'Password must be at least 8 characters long',
      'any.required': 'Password is required'
    }),
  firstName: Joi.string()
    .min(1)
    .max(50)
    .required()
    .messages({
      'string.empty': 'First name is required',
      'string.min': 'First name is required',
      'string.max': 'First name must not exceed 50 characters',
      'any.required': 'First name is required'
    }),
  lastName: Joi.string()
    .min(1)
    .max(50)
    .required()
    .messages({
      'string.min': 'Last name is required',
      'string.max': 'Last name must not exceed 50 characters',
      'any.required': 'Last name is required'
    }),
  phone: Joi.string()
    .pattern(/^[+]?[\d\s\-\(\)]+$/)
    .max(20)
    .optional()
    .messages({
      'string.pattern.base': 'Please provide a valid phone number'
    }),
  language: Joi.string()
    .valid('en', 'th')
    .default('en')
    .messages({
      'any.only': 'Language must be either "en" or "th"'
    })
});

export const userLoginSchema = Joi.object({
  username: Joi.string()
    .required()
    .messages({
      'any.required': 'Username is required'
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    }),
  deviceInfo: Joi.object({
    userAgent: Joi.string().required(),
    ip: Joi.string().ip().required(),
    deviceId: Joi.string().required(),
    deviceName: Joi.string().max(100).optional(),
    deviceType: Joi.string().max(50).optional()
  }).required().messages({
    'any.required': 'Device information is required'
  })
});

// Account validation schemas
export const createAccountSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.min': 'Account name is required',
      'string.max': 'Account name must not exceed 100 characters',
      'any.required': 'Account name is required'
    }),
  account_type: Joi.string()
    .valid('cash', 'bank_account', 'credit_card', 'investment', 'other')
    .required()
    .messages({
      'any.only': 'Account type must be one of: cash, bank_account, credit_card, investment, other',
      'any.required': 'Account type is required'
    }),
  bank_name: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Bank name must not exceed 100 characters'
    }),
  account_number: Joi.string()
    .max(50)
    .optional()
    .messages({
      'string.max': 'Account number must not exceed 50 characters'
    }),
  initial_balance: Joi.number()
    .min(0)
    .precision(2)
    .default(0)
    .messages({
      'number.min': 'Initial balance must be greater than or equal to 0',
      'number.precision': 'Balance can have maximum 2 decimal places'
    }),
  currency: Joi.string()
    .length(3)
    .required()
    .messages({
      'string.length': 'Currency must be a 3-character code (e.g., THB, USD)',
      'any.required': 'Currency is required'
    })
});

export const updateAccountSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'string.max': 'Account name must not exceed 100 characters'
    }),
  account_type: Joi.string()
    .valid('cash', 'bank_account', 'credit_card', 'investment', 'other')
    .optional()
    .messages({
      'any.only': 'Account type must be one of: cash, bank_account, credit_card, investment, other'
    }),
  bank_name: Joi.string()
    .max(100)
    .allow('')
    .optional(),
  account_number: Joi.string()
    .max(50)
    .allow('')
    .optional(),
  currency: Joi.string()
    .length(3)
    .optional()
    .messages({
      'string.length': 'Currency must be a 3-character code (e.g., THB, USD)'
    }),
  current_balance: Joi.number()
    .min(0)
    .precision(2)
    .optional()
    .messages({
      'number.min': 'Current balance must be greater than or equal to 0',
      'number.precision': 'Balance can have maximum 2 decimal places'
    }),
  is_active: Joi.boolean()
    .optional()
});

// Category validation schemas
export const createCategorySchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.min': 'Category name is required',
      'string.max': 'Category name must not exceed 100 characters',
      'any.required': 'Category name is required'
    }),
  description: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Description must not exceed 500 characters'
    }),
  color: Joi.string()
    .pattern(/^#[0-9A-Fa-f]{6}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Color must be a valid color (hex format, e.g., #FF6B6B)'
    }),
  icon: Joi.string()
    .max(50)
    .optional()
    .messages({
      'string.max': 'Icon name must not exceed 50 characters'
    }),
  parent_id: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'Parent ID must be a number',
      'number.integer': 'Parent ID must be an integer',
      'number.positive': 'Parent ID must be a positive number'
    }),
  is_expense: Joi.boolean()
    .required()
    .messages({
      'any.required': 'Category type is required'
    })
});

export const updateCategorySchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'string.max': 'Category name must not exceed 100 characters'
    }),
  description: Joi.string()
    .max(500)
    .allow('')
    .optional(),
  color: Joi.string()
    .pattern(/^#[0-9A-Fa-f]{6}$/)
    .allow('')
    .optional()
    .messages({
      'string.pattern.base': 'Color must be a valid hex color code (e.g., #FF6B6B)'
    }),
  icon: Joi.string()
    .max(50)
    .allow('')
    .optional(),
  parent_id: Joi.number()
    .integer()
    .positive()
    .allow(null)
    .optional(),
  is_expense: Joi.boolean()
    .optional(),
  is_active: Joi.boolean()
    .optional()
});

// Transaction validation schemas
export const createTransactionSchema = Joi.object({
  account_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Account ID must be a number',
      'any.required': 'Account ID is required'
    }),
  category_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Category ID must be a number',
      'any.required': 'Category ID is required'
    }),
  amount: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.positive': 'Amount must be greater than 0',
      'any.required': 'Amount is required'
    }),
  transaction_type: Joi.string()
    .valid('income', 'expense', 'transfer')
    .required()
    .messages({
      'any.only': 'Transaction type must be one of: income, expense, transfer',
      'any.required': 'Transaction type is required'
    }),
  description: Joi.string()
    .max(255)
    .optional()
    .messages({
      'string.max': 'Description must not exceed 255 characters'
    }),
  notes: Joi.string()
    .max(1000)
    .optional()
    .messages({
      'string.max': 'Notes must not exceed 1000 characters'
    }),
  transaction_date: Joi.string()
    .pattern(datePattern)
    .required()
    .messages({
      'string.pattern.base': 'Transaction date must be a valid date',
      'any.required': 'Transaction date is required'
    }),
  transaction_time: Joi.string()
    .pattern(timePattern)
    .optional()
    .messages({
      'string.pattern.base': 'Transaction time must be a valid time'
    }),
  location: Joi.string()
    .max(255)
    .optional()
    .messages({
      'string.max': 'Location must not exceed 255 characters'
    }),
  tags: Joi.array()
    .items(Joi.string().max(50))
    .max(10)
    .optional()
    .messages({
      'array.max': 'Maximum 10 tags allowed'
    }),
  is_recurring: Joi.boolean()
    .default(false)
    .optional(),
  recurring_pattern: Joi.string()
    .valid('daily', 'weekly', 'monthly', 'yearly')
    .optional()
    .messages({
      'any.only': 'Recurring pattern must be one of: daily, weekly, monthly, yearly'
    }),
  recurring_end_date: Joi.string()
    .pattern(datePattern)
    .optional()
    .messages({
      'string.pattern.base': 'Recurring end date must be in YYYY-MM-DD format'
    }),
  reference_number: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Reference number must not exceed 100 characters'
    })
}).prefs({ abortEarly: false });

export const updateTransactionSchema = Joi.object({
  account_id: Joi.number()
    .integer()
    .positive()
    .optional(),
  category_id: Joi.number()
    .integer()
    .positive()
    .optional(),
  amount: Joi.number()
    .positive()
    .precision(2)
    .optional()
    .messages({
      'number.positive': 'Amount must be greater than 0'
    }),
  transaction_type: Joi.string()
    .valid('income', 'expense', 'transfer')
    .optional(),
  description: Joi.string()
    .max(255)
    .allow('')
    .optional(),
  notes: Joi.string()
    .max(1000)
    .allow('')
    .optional(),
  transaction_date: Joi.string()
    .pattern(datePattern)
    .optional()
    .messages({
      'string.pattern.base': 'Date must be in YYYY-MM-DD format'
    }),
  transaction_time: Joi.string()
    .pattern(timePattern)
    .allow('')
    .optional(),
  location: Joi.string()
    .max(255)
    .allow('')
    .optional(),
  tags: Joi.array()
    .items(Joi.string().max(50))
    .max(10)
    .optional(),
  is_recurring: Joi.boolean()
    .optional(),
  recurring_pattern: Joi.string()
    .valid('daily', 'weekly', 'monthly', 'yearly')
    .optional(),
  recurring_end_date: Joi.string()
    .pattern(datePattern)
    .allow('')
    .optional(),
  reference_number: Joi.string()
    .max(100)
    .allow('')
    .optional()
});

// Report validation schemas
export const transactionSummarySchema = Joi.object({
  start_date: Joi.string()
    .pattern(datePattern)
    .optional(),
  end_date: Joi.string()
    .pattern(datePattern)
    .optional(),
  account_id: Joi.number()
    .integer()
    .positive()
    .optional(),
  category_id: Joi.number()
    .integer()
    .positive()
    .optional(),
  transaction_type: Joi.string()
    .valid('income', 'expense', 'transfer')
    .optional(),
  group_by: Joi.string()
    .valid('day', 'week', 'month', 'year')
    .default('month')
    .optional()
});

// Filter validation schemas
export const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .optional(),
  limit: Joi.number()
    .integer()
    .valid(10, 20, 50, 100)
    .default(20)
    .optional(),
  sort_by: Joi.string()
    .optional(),
  sort_order: Joi.string()
    .valid('ASC', 'DESC')
    .default('DESC')
    .optional(),
  search: Joi.string()
    .max(100)
    .optional()
});

export const transactionFilterSchema = paginationSchema.keys({
  account_id: Joi.number()
    .integer()
    .positive()
    .optional(),
  category_id: Joi.number()
    .integer()
    .positive()
    .optional(),
  transaction_type: Joi.string()
    .valid('income', 'expense', 'transfer')
    .optional(),
  min_amount: Joi.number()
    .positive()
    .precision(2)
    .optional(),
  max_amount: Joi.number()
    .positive()
    .precision(2)
    .optional(),
  tags: Joi.array()
    .items(Joi.string().max(50))
    .max(10)
    .optional(),
  start_date: Joi.string()
    .pattern(datePattern)
    .optional(),
  end_date: Joi.string()
    .pattern(datePattern)
    .optional()
});

// Budget validation schemas
export const createMonthlyBudgetSchema = Joi.object({
  category_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'any.required': 'Category ID is required'
    }),
  year: Joi.number()
    .integer()
    .min(2020)
    .max(2100)
    .required()
    .messages({
      'any.required': 'Year is required'
    }),
  month: Joi.number()
    .integer()
    .min(1)
    .max(12)
    .required()
    .messages({
      'any.required': 'Month is required'
    }),
  budget_amount: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'any.required': 'Budget amount is required'
    })
});

// Export validation schemas
export const exportQuerySchema = Joi.object({
  format: Joi.string()
    .valid('excel', 'csv', 'json')
    .required()
    .messages({
      'any.required': 'Export format is required'
    }),
  start_date: Joi.string()
    .pattern(datePattern)
    .optional(),
  end_date: Joi.string()
    .pattern(datePattern)
    .optional(),
  account_id: Joi.number()
    .integer()
    .positive()
    .optional(),
  category_id: Joi.number()
    .integer()
    .positive()
    .optional(),
  transaction_type: Joi.string()
    .valid('income', 'expense', 'transfer')
    .optional()
});

// Export all schemas for middleware use
export const ValidationSchemas = {
  // User schemas
  register: userRegistrationSchema,
  login: userLoginSchema,
  
  // Account schemas
  createAccount: createAccountSchema,
  updateAccount: updateAccountSchema,
  id: Joi.object({ id: Joi.number().integer().positive().required() }),
  
  // Category schemas
  createCategory: createCategorySchema,
  updateCategory: updateCategorySchema,
  
  // Transaction schemas
  createTransaction: createTransactionSchema,
  updateTransaction: updateTransactionSchema,
  transactionQuery: transactionFilterSchema,
  
  // Report schemas
  transactionSummaryQuery: transactionSummarySchema,
  dailySpendingQuery: transactionSummarySchema,
  accountSummaryQuery: transactionSummarySchema,
  categorySpendingQuery: transactionSummarySchema,
  
  // Common schemas
  pagination: paginationSchema
};
