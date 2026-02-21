import dotenv from 'dotenv';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { Account } from '../entities/Account';
import { Category } from '../entities/Category';
import { Transaction } from '../entities/Transaction';
import { AuthUtils } from '../utils/auth';

// Load environment variables
dotenv.config();

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Initialize database connection
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    // Clean existing data
    await AppDataSource.manager.query('DELETE FROM transactions');
    await AppDataSource.manager.query('DELETE FROM categories');
    await AppDataSource.manager.query('DELETE FROM accounts');
    await AppDataSource.manager.query('DELETE FROM user_sessions');
    await AppDataSource.manager.query('DELETE FROM devices');
    await AppDataSource.manager.query('DELETE FROM users');
    console.log('🧹 Cleaned existing data');

    // Create test user
    const userRepository = AppDataSource.getRepository(User);
    const hashedPassword = await AuthUtils.hashPassword('Test1234!');

    const testUser = userRepository.create({
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      language: 'en',
      isActive: true
    });

    await userRepository.save(testUser);
    console.log('👤 Created test user: testuser / Test1234!');

    // Create accounts
    const accountRepository = AppDataSource.getRepository(Account);
    
    const accounts = [
      {
        user_id: testUser.id,
        name: 'Cash Wallet',
        account_type: 'cash',
        initial_balance: 5000,
        current_balance: 5000,
        currency: 'THB',
        is_active: true
      },
      {
        user_id: testUser.id,
        name: 'KBank Savings',
        account_type: 'bank_account',
        bank_name: 'Kasikornbank',
        account_number: '123-456-7890',
        initial_balance: 50000,
        current_balance: 50000,
        currency: 'THB',
        is_active: true
      },
      {
        user_id: testUser.id,
        name: 'SCB Credit Card',
        account_type: 'credit_card',
        bank_name: 'Siam Commercial Bank',
        account_number: '4567-8901-2345',
        initial_balance: -10000,
        current_balance: -10000,
        currency: 'THB',
        is_active: true
      }
    ];

    const createdAccounts = await accountRepository.save(accounts);
    console.log(`💳 Created ${createdAccounts.length} accounts`);

    // Create categories
    const categoryRepository = AppDataSource.getRepository(Category);
    
    const categories = [
      // Income categories
      {
        user_id: testUser.id,
        name: 'Salary',
        description: 'Monthly salary income',
        color: '#4CAF50',
        icon: 'salary',
        is_expense: false,
        is_active: true
      },
      {
        user_id: testUser.id,
        name: 'Freelance',
        description: 'Freelance work income',
        color: '#2196F3',
        icon: 'work',
        is_expense: false,
        is_active: true
      },
      {
        user_id: testUser.id,
        name: 'Investment',
        description: 'Investment returns',
        color: '#FF9800',
        icon: 'trending_up',
        is_expense: false,
        is_active: true
      },
      
      // Expense categories
      {
        user_id: testUser.id,
        name: 'Food & Dining',
        description: 'Restaurants and food delivery',
        color: '#F44336',
        icon: 'restaurant',
        is_expense: true,
        is_active: true
      },
      {
        user_id: testUser.id,
        name: 'Transportation',
        description: 'Public transport and fuel',
        color: '#9C27B0',
        icon: 'directions_car',
        is_expense: true,
        is_active: true
      },
      {
        user_id: testUser.id,
        name: 'Shopping',
        description: 'Clothing and personal items',
        color: '#E91E63',
        icon: 'shopping_cart',
        is_expense: true,
        is_active: true
      },
      {
        user_id: testUser.id,
        name: 'Entertainment',
        description: 'Movies, games, and entertainment',
        color: '#00BCD4',
        icon: 'movie',
        is_expense: true,
        is_active: true
      },
      {
        user_id: testUser.id,
        name: 'Bills & Utilities',
        description: 'Electricity, water, internet bills',
        color: '#795548',
        icon: 'receipt',
        is_expense: true,
        is_active: true
      },
      {
        user_id: testUser.id,
        name: 'Healthcare',
        description: 'Medical expenses and pharmacy',
        color: '#607D8B',
        icon: 'local_hospital',
        is_expense: true,
        is_active: true
      },
      {
        user_id: testUser.id,
        name: 'Education',
        description: 'Courses and learning materials',
        color: '#3F51B5',
        icon: 'school',
        is_expense: true,
        is_active: true
      }
    ];

    const createdCategories = await categoryRepository.save(categories);
    console.log(`📁 Created ${createdCategories.length} categories`);

    // Create transactions
    const transactionRepository = AppDataSource.getRepository(Transaction);
    const currentDate = new Date();
    
    const transactions = [];
    
    // Generate sample transactions for the last 3 months
    for (let monthOffset = 2; monthOffset >= 0; monthOffset--) {
      const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - monthOffset, 1);
      const daysInMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
      
      // Income transactions (beginning of month)
      transactions.push({
        user_id: testUser.id,
        account_id: createdAccounts[1].id, // KBank Savings
        category_id: createdCategories[0].id, // Salary
        amount: 50000,
        transaction_type: 'income',
        description: 'Monthly Salary',
        notes: 'Salary for month',
        transaction_date: new Date(targetDate.getFullYear(), targetDate.getMonth(), 1),
        transaction_time: new Date(targetDate.getFullYear(), targetDate.getMonth(), 1, 9, 0),
        location: 'Bangkok',
        tags: ['salary', 'monthly'],
        is_recurring: true,
        recurring_pattern: 'monthly',
        reference_number: `SAL-${targetDate.getFullYear()}${String(targetDate.getMonth() + 1).padStart(2, '0')}`
      });

      // Random expense transactions throughout the month
      for (let day = 1; day <= Math.min(daysInMonth, 15); day++) {
        const randomDay = Math.floor(Math.random() * daysInMonth) + 1;
        const randomAccount = createdAccounts[Math.floor(Math.random() * createdAccounts.length)];
        const randomExpenseCategory = createdCategories.slice(3); // Expense categories only
        
        transactions.push({
          user_id: testUser.id,
          account_id: randomAccount.id,
          category_id: randomExpenseCategory[Math.floor(Math.random() * randomExpenseCategory.length)].id,
          amount: Math.floor(Math.random() * 2000) + 100, // 100-2100
          transaction_type: 'expense',
          description: `Daily expense ${randomDay}`,
          notes: 'Sample transaction',
          transaction_date: new Date(targetDate.getFullYear(), targetDate.getMonth(), randomDay),
          transaction_time: new Date(targetDate.getFullYear(), targetDate.getMonth(), randomDay, 12 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60)),
          location: ['Bangkok', 'Online', 'Store'][Math.floor(Math.random() * 3)],
          tags: ['sample'],
          is_recurring: false
        });
      }
    }

    await transactionRepository.save(transactions);
    console.log(`💰 Created ${transactions.length} transactions`);

    // Update account balances based on transactions
    for (const account of createdAccounts) {
      const accountTransactions = transactions.filter(t => t.account_id === account.id);
      let balance = account.initial_balance;
      
      for (const transaction of accountTransactions) {
        if (transaction.transaction_type === 'income') {
          balance += transaction.amount;
        } else {
          balance -= transaction.amount;
        }
      }
      
      account.current_balance = balance;
      await accountRepository.save(account);
    }

    console.log('🔄 Updated account balances');
    console.log('✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   User: testuser (password: Test1234!)`);
    console.log(`   Accounts: ${createdAccounts.length}`);
    console.log(`   Categories: ${createdCategories.length}`);
    console.log(`   Transactions: ${transactions.length}`);
    console.log('\n🚀 Ready to test the API!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

export default seedDatabase;
