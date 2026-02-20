# EdVISORY Expense Tracker Backend

A comprehensive expense tracking backend API built with Node.js, TypeScript, Fastify, and PostgreSQL.

## 🚀 Features Implemented

### Authentication System
- ✅ User registration and login
- ✅ JWT-based session management
- ✅ Device management and tracking
- ✅ Multi-language support (English/Thai)
- ✅ Password hashing and security
- ✅ Logout and logout-all functionality

### Account Management
- ✅ Create, read, update, delete accounts
- ✅ Support for multiple account types (bank, cash, credit card, etc.)
- ✅ Account balance tracking
- ✅ Soft delete for data integrity
- ✅ Search and filtering capabilities

### Category Management
- ✅ Hierarchical category structure (parent/child relationships)
- ✅ Income and expense categories
- ✅ Color coding and icons
- ✅ Circular reference prevention
- ✅ Category usage validation

### Transaction Management
- ✅ Create, read, update, delete transactions
- ✅ Support for income, expense, and transfer types
- ✅ Automatic balance updates
- ✅ Transaction tagging and metadata
- ✅ Recurring transaction support
- ✅ Advanced filtering and search

### Reporting & Analytics
- ✅ Transaction summary reports
- ✅ Daily spending analysis
- ✅ Account balance summaries
- ✅ Category spending breakdowns
- ✅ Date range filtering
- ✅ Grouping by day/week/month/year

### Security & Middleware
- ✅ Authentication middleware
- ✅ Rate limiting
- ✅ Request/response logging
- ✅ Error handling
- ✅ CORS configuration
- ✅ Security headers (Helmet)
- ✅ Input validation and sanitization

### Internationalization
- ✅ Multi-language support (English/Thai)
- ✅ Localized error messages
- ✅ Translation key system
- ✅ Language detection from headers

## 📁 Project Structure

```
backend/src/
├── config/
│   ├── database.ts          # Database configuration
│   └── validation.ts        # Joi validation schemas
├── entities/
│   ├── Account.ts           # Account entity
│   ├── Category.ts          # Category entity
│   ├── Transaction.ts       # Transaction entity
│   ├── User.ts              # User entity
│   ├── Device.ts            # Device entity
│   ├── UserSession.ts       # User session entity
│   ├── AuditLog.ts          # Audit log entity
│   ├── MonthlyBudget.ts     # Monthly budget entity
│   ├── SystemSetting.ts     # System settings entity
│   └── TransactionAttachment.ts # Transaction attachments
├── middleware/
│   ├── auth.ts              # Authentication middleware
│   ├── error-handler.ts     # Global error handler
│   ├── rate-limiter.ts      # Rate limiting middleware
│   └── request-logger.ts    # Request/response logging
├── routes/
│   ├── auth.ts              # Authentication routes
│   ├── accounts.ts          # Account management routes
│   ├── categories.ts        # Category management routes
│   ├── transactions.ts      # Transaction management routes
│   └── reports.ts           # Reporting routes
├── utils/
│   ├── auth.ts              # Authentication utilities
│   ├── i18n.ts              # Internationalization utilities
│   └── profanity-filter.ts   # Content filtering
├── types/
│   └── index.ts             # TypeScript type definitions
└── app.ts                   # Main application file
```

## 🛠️ Technology Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Fastify
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: Custom Session-based Authentication
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting
- **Internationalization**: Custom i18n system
- **File Upload**: Multer
- **Logging**: Pino

## 📋 API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `POST /logout` - Logout current session
- `POST /logout-all` - Logout all sessions

### Accounts (`/api/accounts`)
- `GET /accounts` - List all accounts
- `POST /accounts` - Create new account
- `GET /accounts/:id` - Get account details
- `PATCH /accounts/:id` - Update account
- `DELETE /accounts/:id` - Delete account (soft delete)

### Categories (`/api/categories`)
- `GET /categories` - List all categories
- `POST /categories` - Create new category
- `GET /categories/:id` - Get category details
- `PATCH /categories/:id` - Update category
- `DELETE /categories/:id` - Delete category (soft delete)

### Transactions (`/api/transactions`)
- `GET /transactions` - List all transactions
- `POST /transactions` - Create new transaction
- `GET /transactions/:id` - Get transaction details
- `PATCH /transactions/:id` - Update transaction
- `DELETE /transactions/:id` - Delete transaction

### Reports (`/api/reports`)
- `GET /reports/transaction-summary` - Transaction summary report
- `GET /reports/daily-spending` - Daily spending analysis
- `GET /reports/account-summary` - Account balance summary
- `GET /reports/category-spending` - Category spending breakdown

### Health Check
- `GET /health` - Server health status

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=edvisory_expense_tracker

# Server
PORT=3000
HOST=localhost
NODE_ENV=development
LOG_LEVEL=info

# Security
JWT_SECRET=your_jwt_secret_key
BCRYPT_ROUNDS=12

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd edvisory-expense-tracker/backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Set up the database:
```bash
# Create database
createdb edvisory_expense_tracker

# Run migrations (if implemented)
npm run migrate
```

5. Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## 📊 Database Schema

The application uses the following main entities:

### Users
- User authentication and profile information
- Language preferences
- Account ownership

### Accounts
- Financial accounts (bank, cash, credit cards)
- Balance tracking
- Account types and metadata

### Categories
- Transaction categorization
- Hierarchical structure
- Income/expense classification

### Transactions
- Financial transactions
- Automatic balance updates
- Rich metadata and tagging

### Devices & Sessions
- Device tracking for security
- Session management
- Multi-device support

## 🔒 Security Features

- **Custom Session Authentication**: Secure token-based authentication with database storage
- **Password Hashing**: Bcrypt with configurable rounds
- **Rate Limiting**: Prevent brute force attacks
- **Input Validation**: Joi schemas for all inputs
- **SQL Injection Prevention**: TypeORM parameterized queries
- **CORS Protection**: Configurable cross-origin policies
- **Security Headers**: Helmet for additional security
- **Request Logging**: Comprehensive audit trail

## 🌍 Internationalization

The application supports multiple languages:
- English (en)
- Thai (th)

Translation keys are organized by feature:
- Authentication (`auth.*`)
- General (`general.*`)
- Accounts (`account.*`)
- Categories (`category.*`)
- Transactions (`transaction.*`)
- Reports (`report.*`)

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run with coverage
npm run test:coverage
```

## 📝 API Documentation

The API follows RESTful conventions and returns consistent responses:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

## 🚀 Deployment

### Docker Deployment

```bash
# Build the image
docker build -t edvisory-backend .

# Run the container
docker run -p 3000:3000 --env-file .env edvisory-backend
```

### Production Considerations

- Use environment-specific configuration
- Enable HTTPS in production
- Set up proper database connection pooling
- Configure logging for production
- Set up monitoring and alerting
- Use a reverse proxy (nginx/Apache)
- Regular security updates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation
- Review the code comments

## 🔄 Version History

- **v1.0.0** - Initial implementation with core features
  - Authentication system
  - Account management
  - Category management
  - Transaction management
  - Basic reporting
  - Multi-language support
  - Security middleware
