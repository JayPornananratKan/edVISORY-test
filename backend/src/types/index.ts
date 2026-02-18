import { FastifyRequest } from 'fastify';

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Authentication Types
export interface AuthenticatedRequest extends FastifyRequest {
  user: {
    id: number;
    username: string;
    email: string;
    language: string;
  };
  session: {
    id: number;
    token: string;
    expires_at: Date;
  };
}

// User Types
export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
  full_name?: string;
  phone?: string;
  language?: string;
}

export interface LoginDto {
  username: string;
  password: string;
  deviceInfo: {
    userAgent: string;
    ip: string;
    deviceId: string;
    deviceName?: string;
    deviceType?: string;
  };
}

export interface RegisterResponse {
  user: {
    id: number;
    username: string;
    email: string;
    full_name: string;
    language: string;
    created_at: Date;
  };
  session: {
    token: string;
    expires_at: Date;
  };
}

// Account Types
export interface CreateAccountDto {
  name: string;
  account_type: string;
  bank_name?: string;
  account_number?: string;
  initial_balance?: number;
  currency?: string;
}

export interface UpdateAccountDto {
  name?: string;
  account_type?: string;
  bank_name?: string;
  account_number?: string;
  currency?: string;
  is_active?: boolean;
}

// Category Types
export interface CreateCategoryDto {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parent_id?: number;
  is_expense?: boolean;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  parent_id?: number;
  is_expense?: boolean;
  is_active?: boolean;
}

// Transaction Types
export interface CreateTransactionDto {
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

export interface UpdateTransactionDto {
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

// Report Types
export interface TransactionSummaryQuery {
  start_date?: string;
  end_date?: string;
  account_id?: number;
  category_id?: number;
  transaction_type?: string;
  group_by?: 'day' | 'week' | 'month' | 'year';
}

export interface TransactionSummary {
  period: string;
  total_income: number;
  total_expense: number;
  net_amount: number;
  transaction_count: number;
  breakdown: {
    category_id: number;
    category_name: string;
    amount: number;
    percentage: number;
  }[];
}

export interface DailySpendingQuery {
  month: number;
  year: number;
  target_monthly_spending?: number;
  current_month_spending?: number;
}

export interface DailySpendingAnalysis {
  days_remaining: number;
  daily_allowance: number;
  current_daily_average: number;
  recommended_daily_spending: number;
  status: 'on_track' | 'over_budget' | 'under_budget';
}

// File Upload Types
export interface FileUploadDto {
  file_name: string;
  original_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  file_hash: string;
}

// Filter and Query Types
export interface FilterQuery {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
  search?: string;
  start_date?: string;
  end_date?: string;
}

export interface TransactionFilterQuery extends FilterQuery {
  account_id?: number;
  category_id?: number;
  transaction_type?: string;
  min_amount?: number;
  max_amount?: number;
  tags?: string[];
}

// Error Types
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ApiError {
  code: string;
  message: string;
  details?: ValidationError[];
  timestamp: Date;
  path: string;
}

// System Settings Types
export interface SystemSetting {
  setting_key: string;
  setting_value: string;
  description: string;
  is_public: boolean;
}

// Device Management Types
export interface DeviceInfo {
  device_id: string;
  device_name?: string;
  device_type?: string;
  user_agent: string;
  ip_address: string;
}

export interface SessionInfo {
  id: number;
  session_token: string;
  device: DeviceInfo;
  is_active: boolean;
  last_accessed_at: Date;
  expires_at: Date;
}

// Budget Types
export interface CreateMonthlyBudgetDto {
  category_id: number;
  year: number;
  month: number;
  budget_amount: number;
}

export interface UpdateMonthlyBudgetDto {
  budget_amount?: number;
  is_active?: boolean;
}

// Export Types
export interface ExportQuery {
  format: 'excel' | 'csv' | 'json';
  start_date?: string;
  end_date?: string;
  account_id?: number;
  category_id?: number;
  transaction_type?: string;
}

// Import Types
export interface ImportResult {
  success: boolean;
  total_rows: number;
  imported_rows: number;
  failed_rows: number;
  errors: {
    row: number;
    error: string;
    data: any;
  }[];
}
