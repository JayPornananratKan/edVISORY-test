import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { Account } from '../entities/Account';
import { Category } from '../entities/Category';
import { Transaction } from '../entities/Transaction';
import { Device } from '../entities/Device';
import { UserSession } from '../entities/UserSession';
import { AuditLog } from '../entities/AuditLog';
import { MonthlyBudget } from '../entities/MonthlyBudget';
import { SystemSetting } from '../entities/SystemSetting';
import { TransactionAttachment } from '../entities/TransactionAttachment';

async function syncDatabase() {
  try {
    console.log('🔄 Starting database synchronization...');

    // Initialize database connection
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    // Synchronize all entities (create tables if they don't exist)
    await AppDataSource.synchronize(true);
    console.log('🔧 Database synchronized successfully!');

    // Show created tables
    const metadata = AppDataSource.entityMetadatas;
    console.log('\n📋 Tables created/updated:');
    metadata.forEach(meta => {
      console.log(`   ✓ ${meta.tableName}`);
    });

    console.log('\n✅ Database is ready for seeding!');
    console.log('💡 Run "npm run db:seed" to populate with sample data');

  } catch (error) {
    console.error('❌ Error synchronizing database:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

// Run sync if this file is executed directly
if (require.main === module) {
  syncDatabase();
}

export default syncDatabase;
