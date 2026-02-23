import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Transaction } from '../entities/Transaction';
import { Account } from '../entities/Account';
import { Category } from '../entities/Category';
import * as XLSX from 'xlsx';

export interface ExportOptions {
  format: 'excel' | 'csv' | 'json' | 'googlesheet';
  start_date?: string;
  end_date?: string;
  account_ids?: number[];
  category_ids?: number[];
  transaction_type?: 'income' | 'expense' | 'all';
  include_attachments?: boolean;
}

export interface ImportResult {
  success: boolean;
  message: string;
  imported_count: number;
  failed_count: number;
  errors: string[];
  imported_transactions?: any[];
}

export class ExportImportService {
  private transactionRepository: Repository<Transaction>;
  private accountRepository: Repository<Account>;
  private categoryRepository: Repository<Category>;

  constructor() {
    this.transactionRepository = AppDataSource.getRepository(Transaction);
    this.accountRepository = AppDataSource.getRepository(Account);
    this.categoryRepository = AppDataSource.getRepository(Category);
  }

  /**
   * Export transactions to various formats
   */
  async exportTransactions(userId: number, options: ExportOptions): Promise<{
    data: Buffer | string;
    filename: string;
    mimeType: string;
  }> {
    // Build query based on options
    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.account', 'account')
      .leftJoinAndSelect('transaction.category', 'category')
      .where('transaction.user_id = :userId', { userId });

    // Apply filters
    if (options.start_date) {
      queryBuilder.andWhere('transaction.transaction_date >= :startDate', { 
        startDate: options.start_date 
      });
    }

    if (options.end_date) {
      queryBuilder.andWhere('transaction.transaction_date <= :endDate', { 
        endDate: options.end_date 
      });
    }

    if (options.account_ids && options.account_ids.length > 0) {
      queryBuilder.andWhere('transaction.account_id IN (:...accountIds)', { 
        accountIds: options.account_ids 
      });
    }

    if (options.category_ids && options.category_ids.length > 0) {
      queryBuilder.andWhere('transaction.category_id IN (:...categoryIds)', { 
        categoryIds: options.category_ids 
      });
    }

    if (options.transaction_type && options.transaction_type !== 'all') {
      queryBuilder.andWhere('transaction.transaction_type = :transactionType', { 
        transactionType: options.transaction_type 
      });
    }

    const transactions = await queryBuilder
      .orderBy('transaction.transaction_date', 'DESC')
      .getMany();

    // Format data for export
    const exportData = transactions.map(t => ({
      id: t.id,
      date: t.transaction_date,
      time: t.transaction_time,
      description: t.description || '',
      notes: t.notes || '',
      amount: t.amount,
      type: t.transaction_type,
      account_name: t.account?.name || '',
      account_type: t.account?.account_type || '',
      category_name: t.category?.name || '',
      location: t.location || '',
      tags: (t.tags || []).join(', '),
      is_recurring: t.is_recurring,
      recurring_pattern: t.recurring_pattern || '',
      reference_number: t.reference_number || '',
      created_at: t.created_at
    }));

    const filename = `transactions_${new Date().toISOString().split('T')[0]}`;

    switch (options.format) {
      case 'excel':
        return this.exportToExcel(exportData, filename);
      case 'csv':
        return this.exportToCSV(exportData, filename);
      case 'json':
        return this.exportToJSON(exportData, filename);
      case 'googlesheet':
        return this.exportToGoogleSheet(exportData, filename, userId);
      default:
        throw new Error('Unsupported export format');
    }
  }

  /**
   * Export to Excel format
   */
  private async exportToExcel(data: any[], filename: string): Promise<{
    data: Buffer;
    filename: string;
    mimeType: string;
  }> {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Set column widths
    const colWidths = [
      { wch: 8 },  // ID
      { wch: 12 }, // Date
      { wch: 8 },  // Time
      { wch: 25 }, // Description
      { wch: 20 }, // Notes
      { wch: 12 }, // Amount
      { wch: 10 }, // Type
      { wch: 15 }, // Account Name
      { wch: 12 }, // Account Type
      { wch: 15 }, // Category
      { wch: 15 }, // Location
      { wch: 20 }, // Tags
      { wch: 10 }, // Recurring
      { wch: 15 }, // Recurring Pattern
      { wch: 15 }, // Reference
      { wch: 20 }  // Created At
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return {
      data: excelBuffer,
      filename: `${filename}.xlsx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
  }

  /**
   * Export to CSV format
   */
  private async exportToCSV(data: any[], filename: string): Promise<{
    data: string;
    filename: string;
    mimeType: string;
  }> {
    const headers = [
      'ID', 'Date', 'Time', 'Description', 'Notes', 'Amount', 'Type',
      'Account Name', 'Account Type', 'Category', 'Location', 'Tags',
      'Is Recurring', 'Recurring Pattern', 'Reference Number', 'Created At'
    ];

    const csvRows = [
      headers.join(','),
      ...data.map(row => [
        row.id,
        row.date,
        row.time,
        `"${row.description.replace(/"/g, '""')}"`,
        `"${row.notes.replace(/"/g, '""')}"`,
        row.amount,
        row.type,
        `"${row.account_name.replace(/"/g, '""')}"`,
        row.account_type,
        `"${row.category_name.replace(/"/g, '""')}"`,
        `"${row.location.replace(/"/g, '""')}"`,
        `"${row.tags.replace(/"/g, '""')}"`,
        row.is_recurring,
        `"${row.recurring_pattern.replace(/"/g, '""')}"`,
        `"${row.reference_number.replace(/"/g, '""')}"`,
        row.created_at
      ].join(','))
    ];

    return {
      data: csvRows.join('\n'),
      filename: `${filename}.csv`,
      mimeType: 'text/csv'
    };
  }

  /**
   * Export to JSON format
   */
  private async exportToJSON(data: any[], filename: string): Promise<{
    data: string;
    filename: string;
    mimeType: string;
  }> {
    const jsonData = {
      export_date: new Date().toISOString(),
      total_transactions: data.length,
      transactions: data
    };

    return {
      data: JSON.stringify(jsonData, null, 2),
      filename: `${filename}.json`,
      mimeType: 'application/json'
    };
  }

  /**
   * Export to Google Sheets
   */
  private async exportToGoogleSheet(data: any[], filename: string, userId: number): Promise<{
    data: string;
    filename: string;
    mimeType: string;
    spreadsheetId?: string;
    spreadsheetUrl?: string;
  }> {
    try {
      // Check if Google Sheets credentials are configured
      const credentials = process.env.GOOGLE_SHEETS_CREDENTIALS;
      const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
      
      if (!credentials) {
        // Fallback to JSON format if Google Sheets not configured
        console.warn('Google Sheets credentials not configured, falling back to JSON format');
        const googleSheetsData = {
          spreadsheetName: filename,
          sheets: [{
            name: 'Transactions',
            data: data
          }],
          note: 'Google Sheets API not configured. This is a placeholder export.'
        };

        return {
          data: JSON.stringify(googleSheetsData, null, 2),
          filename: `${filename}_googlesheet.json`,
          mimeType: 'application/json'
        };
      }

      // Initialize Google Sheets API
      const { google } = require('googleapis');
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(credentials),
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      const sheets = google.sheets({ version: 'v4', auth });
      
      // Prepare data for Google Sheets format
      if (data.length === 0) {
        throw new Error('No data to export');
      }

      // Get headers from first object
      const headers = Object.keys(data[0]);
      
      // Convert data to 2D array for Google Sheets
      const rows = [
        headers, // Header row
        ...data.map(item => headers.map(header => item[header] || ''))
      ];

      // Create or update spreadsheet
      let targetSpreadsheetId = spreadsheetId;
      
      if (!targetSpreadsheetId) {
        // Create new spreadsheet
        const response = await sheets.spreadsheets.create({
          requestBody: {
            properties: {
              title: `${filename}_${new Date().toISOString().split('T')[0]}`
            },
            sheets: [{
              properties: {
                title: 'Transactions'
              }
            }]
          }
        });
        
        targetSpreadsheetId = response.data.spreadsheetId;
      }

      // Write data to spreadsheet
      await sheets.spreadsheets.values.update({
        spreadsheetId: targetSpreadsheetId,
        range: 'Transactions!A1',
        valueInputOption: 'RAW',
        requestBody: {
          values: rows
        }
      });

      // Get spreadsheet URL
      const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${targetSpreadsheetId}`;

      return {
        data: JSON.stringify({
          message: 'Successfully exported to Google Sheets',
          spreadsheetId: targetSpreadsheetId,
          spreadsheetUrl: spreadsheetUrl,
          rowsExported: rows.length,
          filename: filename
        }, null, 2),
        filename: `${filename}_googlesheet_export.json`,
        mimeType: 'application/json',
        spreadsheetId: targetSpreadsheetId,
        spreadsheetUrl: spreadsheetUrl
      };

    } catch (error) {
      console.error('Google Sheets export error:', error);
      
      // Fallback to JSON format on error
      const googleSheetsData = {
        spreadsheetName: filename,
        sheets: [{
          name: 'Transactions',
          data: data
        }],
        error: 'Google Sheets export failed, fallback to JSON format',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };

      return {
        data: JSON.stringify(googleSheetsData, null, 2),
        filename: `${filename}_googlesheet_error.json`,
        mimeType: 'application/json'
      };
    }
  }

  /**
   * Import transactions from various formats
   */
  async importTransactions(userId: number, file: Buffer, format: 'excel' | 'csv' | 'json'): Promise<ImportResult> {
    try {
      let transactions: any[] = [];

      switch (format) {
        case 'excel':
          transactions = await this.parseExcel(file);
          break;
        case 'csv':
          transactions = await this.parseCSV(file);
          break;
        case 'json':
          transactions = await this.parseJSON(file);
          break;
        default:
          throw new Error('Unsupported import format');
      }

      return await this.processImportedTransactions(userId, transactions);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: `Import failed: ${errorMessage}`,
        imported_count: 0,
        failed_count: 0,
        errors: [errorMessage]
      };
    }
  }

  /**
   * Parse Excel file
   */
  private async parseExcel(file: Buffer): Promise<any[]> {
    const workbook = XLSX.read(file, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    return this.normalizeImportData(data);
  }

  /**
   * Parse CSV file
   */
  private async parseCSV(file: Buffer): Promise<any[]> {
    const csvText = file.toString('utf-8');
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = this.parseCSVLine(lines[i]);
        const row: any = {};
        headers.forEach((header, index) => {
          row[header.toLowerCase().replace(/\s+/g, '_')] = values[index];
        });
        data.push(row);
      }
    }
    
    return this.normalizeImportData(data);
  }

  /**
   * Parse CSV line handling quoted values
   */
  private parseCSVLine(line: string): string[] {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  /**
   * Parse JSON file
   */
  private async parseJSON(file: Buffer): Promise<any[]> {
    const jsonText = file.toString('utf-8');
    const jsonData = JSON.parse(jsonText);
    
    let transactions = [];
    if (Array.isArray(jsonData)) {
      transactions = jsonData;
    } else if (jsonData.transactions && Array.isArray(jsonData.transactions)) {
      transactions = jsonData.transactions;
    } else {
      throw new Error('Invalid JSON format. Expected array or {transactions: [...]}');
    }
    
    return this.normalizeImportData(transactions);
  }

  /**
   * Normalize imported data to standard format
   */
  private normalizeImportData(data: any[]): any[] {
    return data.map(row => {
      // Map various possible column names to standard names
      return {
        date: row.date || row.Date || row.transaction_date || row['Transaction Date'],
        time: row.time || row.Time || row.transaction_time || row['Transaction Time'] || '12:00:00',
        description: row.description || row.Description || row.description || '',
        notes: row.notes || row.Notes || row.note || '',
        amount: parseFloat(row.amount || row.Amount || row.transaction_amount || row['Transaction Amount'] || 0),
        type: row.type || row.Type || row.transaction_type || row['Transaction Type'] || 'expense',
        account_name: row.account_name || row['Account Name'] || row.account || '',
        category_name: row.category_name || row['Category Name'] || row.category || '',
        location: row.location || row.Location || '',
        tags: row.tags || row.Tags || row.tag || '',
        is_recurring: row.is_recurring || row['Is Recurring'] || false,
        recurring_pattern: row.recurring_pattern || row['Recurring Pattern'] || '',
        reference_number: row.reference_number || row['Reference Number'] || ''
      };
    }).filter(row => row.date && row.amount > 0);
  }

  /**
   * Process imported transactions
   */
  private async processImportedTransactions(userId: number, transactions: any[]): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      message: 'Import completed',
      imported_count: 0,
      failed_count: 0,
      errors: [],
      imported_transactions: []
    };

    // Get user's accounts and categories for mapping
    const accounts = await this.accountRepository.find({
      where: { user_id: userId }
    });
    
    const categories = await this.categoryRepository.find({
      where: { user_id: userId }
    });

    const accountMap = new Map(accounts.map(a => [a.name.toLowerCase(), a.id]));
    const categoryMap = new Map(categories.map(c => [c.name.toLowerCase(), c.id]));

    for (const tx of transactions) {
      try {
        // Find or create account
        let accountId = accountMap.get(tx.account_name.toLowerCase());
        if (!accountId && tx.account_name) {
          // Create new account if not found
          const newAccount = this.accountRepository.create({
            user_id: userId,
            name: tx.account_name,
            account_type: 'bank_account',
            initial_balance: 0,
            current_balance: 0,
            currency: 'THB'
          });
          const savedAccount = await this.accountRepository.save(newAccount);
          accountId = savedAccount.id;
          accountMap.set(tx.account_name.toLowerCase(), accountId);
        }

        // Find or create category
        let categoryId = categoryMap.get(tx.category_name.toLowerCase());
        if (!categoryId && tx.category_name) {
          // Create new category if not found
          const isExpense = tx.type === 'expense';
          const newCategory = this.categoryRepository.create({
            user_id: userId,
            name: tx.category_name,
            is_expense: isExpense,
            is_active: true
          });
          const savedCategory = await this.categoryRepository.save(newCategory);
          categoryId = savedCategory.id;
          categoryMap.set(tx.category_name.toLowerCase(), categoryId);
        }

        // Create transaction
        const transaction = this.transactionRepository.create({
          user_id: userId,
          account_id: accountId || accounts[0]?.id, // Use first account if no match
          category_id: categoryId || categories[0]?.id, // Use first category if no match
          amount: tx.amount,
          transaction_type: tx.type,
          description: tx.description,
          notes: tx.notes,
          transaction_date: new Date(tx.date),
          transaction_time: tx.time ? new Date(`1970-01-01T${tx.time}`) : new Date(),
          location: tx.location,
          tags: tx.tags ? tx.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t) : [],
          is_recurring: tx.is_recurring,
          recurring_pattern: tx.recurring_pattern,
          reference_number: tx.reference_number
        });

        const savedTransaction = await this.transactionRepository.save(transaction);
        
        // Update account balance
        if (accountId) {
          const account = await this.accountRepository.findOne({ where: { id: accountId } });
          if (account) {
            if (tx.type === 'income') {
              account.current_balance = Number(account.current_balance) + Number(tx.amount);
            } else {
              account.current_balance = Number(account.current_balance) - Number(tx.amount);
            }
            await this.accountRepository.save(account);
          }
        }

        result.imported_count++;
        result.imported_transactions?.push(savedTransaction);
        
      } catch (error) {
        result.failed_count++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        result.errors.push(`Row ${result.imported_count + result.failed_count}: ${errorMessage}`);
      }
    }

    if (result.failed_count > 0) {
      result.success = result.imported_count > 0;
      result.message = `Import completed with ${result.imported_count} successful and ${result.failed_count} failed`;
    }

    return result;
  }

  /**
   * Get import template
   */
  async getImportTemplate(format: 'excel' | 'csv' | 'json'): Promise<{
    data: Buffer | string;
    filename: string;
    mimeType: string;
  }> {
    const templateData = [
      {
        date: '2024-01-15',
        time: '12:30:00',
        description: 'Sample transaction',
        notes: 'Sample notes',
        amount: 150.50,
        type: 'expense',
        account_name: 'Savings Account',
        category_name: 'Food & Dining',
        location: 'Bangkok',
        tags: 'business, lunch',
        is_recurring: false,
        recurring_pattern: '',
        reference_number: ''
      }
    ];

    const filename = `import_template_${new Date().toISOString().split('T')[0]}`;

    switch (format) {
      case 'excel':
        return this.exportToExcel(templateData, filename);
      case 'csv':
        return this.exportToCSV(templateData, filename);
      case 'json':
        return this.exportToJSON(templateData, filename);
      default:
        throw new Error('Unsupported template format');
    }
  }
}
