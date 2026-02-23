"# EdVISORY Expense Tracker

A comprehensive expense tracking backend API built with Node.js, TypeScript, Fastify, and PostgreSQL.

## 🚀 Features

### Core Functionality
- **User Authentication** - Secure registration, login, and session management
- **Account Management** - Multiple account types (bank, cash, credit cards) with balance tracking
- **Category Management** - Hierarchical categories for income and expenses
- **Transaction Management** - Create, update, and track financial transactions
- **Reporting & Analytics** - Comprehensive financial reports and insights
- **Multi-language Support** - English and Thai language support

### Security Features
- **Custom Session-based Authentication** with device tracking
- Password hashing with bcrypt
- Rate limiting and request validation
- CORS protection and security headers
- SQL injection prevention

## 🛠️ Technology Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Fastify
- **Database**: PostgreSQL with TypeORM
- **Authentication**: Custom session-based system
- **Validation**: Joi schemas
- **Security**: Helmet, CORS, Rate Limiting
- **Internationalization**: Custom i18n system
- **Testing**: Jest with TypeScript support

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- PostgreSQL 12.0 or higher
- npm or yarn package manager

## 🚀 Quick Start

### Option 1: Docker (Recommended)

#### Prerequisites
- Docker and Docker Compose installed

#### 1. Clone Repository
```bash
git clone <repository-url>
cd EdVISORY-test
npm install
```

#### 2. Start with Docker Compose
```bash
# Start all services (database + backend)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### 3. Database Setup (Auto-configured)
The database is automatically created and configured. Access:
- **PostgreSQL**: `localhost:5432`
- **PgAdmin**: `http://localhost:5050` (admin@expensetracker.com / admin123)

#### 4. Sync Database Schema
```bash
# Run database migrations
npm run db:sync

# (Optional) Seed with sample data
npm run db:seed
```

The API will be available at `http://localhost:3000`



## 🔧 Configuration

### Environment Variables (.env)

```env
# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=expense_tracker

# Server Configuration
PORT=3000
HOST=localhost
NODE_ENV=development
LOG_LEVEL=info

# Security
CUSTOM_SESSION_SECRET=your_custom_session_secret_key_here
BCRYPT_ROUNDS=12

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 📁 Project Structure

```
backend/src/
├── config/          # Database and validation configuration
├── entities/         # TypeORM entities (User, Account, Transaction, etc.)
├── middleware/       # Custom middleware (auth, logging, rate limiting)
├── routes/           # API route handlers
├── services/         # Business logic services
├── utils/            # Utility functions (auth, i18n, etc.)
├── types/            # TypeScript type definitions
└── app.ts            # Main application entry point
```

## 🌐 API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `POST /logout` - Logout current session
- `POST /logout-all` - Logout all sessions

### Accounts (`/api/accounts`)
- `GET /accounts` - List all user accounts
- `POST /accounts` - Create new account
- `GET /accounts/:id` - Get account details
- `PATCH /accounts/:id` - Update account
- `DELETE /accounts/:id` - Delete account (soft delete)

### Categories (`/api/categories`)
- `GET /categories` - List all categories
- `POST /categories` - Create new category
- `GET /categories/:id` - Get category details
- `PATCH /categories/:id` - Update category
- `DELETE /categories/:id` - Delete category

### Transactions (`/api/transactions`)
- `GET /transactions` - List transactions with filtering
- `POST /transactions` - Create new transaction
- `GET /transactions/:id` - Get transaction details
- `PATCH /transactions/:id` - Update transaction
- `DELETE /transactions/:id` - Delete transaction

### Reports (`/api/reports`)
- `GET /reports/transaction-summary` - Transaction summary by date range
- `GET /reports/daily-spending` - Daily spending analysis
- `GET /reports/account-summary` - Account balance summary
- `GET /reports/category-spending` - Category spending breakdown

### Health Check
- `GET /health` - Server health status

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage และดูใน terminal
npm test -- --coverage
 
# Generate coverage + HTML report
npm test -- --coverage --coverageReporters=html
 
# Clear coverage และ generate ใหม่
npm test -- --coverage --coverageReporters=text --clearCache

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix
```

## 📊 Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm run start        # Start production server

# Database
npm run db:sync      # Sync database schema
npm run db:seed      # Seed database with sample data

# Quality Assurance
npm test             # Run test suite
```

## 📚 Documentation

- **[API Documentation](./API_DOCUMENTATION.md)** - Complete API reference
- **[Backend README](./BACKEND_README.md)** - Detailed backend documentation
- **[Postman Guide](./API_POSTMAN_GUIDE.md)** - Postman collection setup

## 🔒 Security Considerations

- All passwords are hashed using bcrypt with configurable rounds
- Custom Session tokens are stored securely in database sessions
- Rate limiting prevents brute force attacks
- Input validation on all endpoints using Joi schemas
- CORS configured for cross-origin security
- Security headers implemented via Helmet middleware

## 🌍 Internationalization

The application supports multiple languages:
- English (en)
- Thai (th)

Language detection is automatic based on user preferences or Accept-Language header.

## � Docker Deployment

### Using Docker Compose (Recommended)

The project includes `docker-compose.yml` for easy development setup:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: expense-tracker-postgres
    environment:
      POSTGRES_DB: expense_tracker
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: expense-tracker-pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@expensetracker.com
      PGADMIN_DEFAULT_PASSWORD: admin123
    ports:
      - "5050:80"
    volumes:
      - pgadmin_data:/var/lib/pgadmin
    depends_on:
      - postgres
    restart: unless-stopped

volumes:
  postgres_data:
  pgadmin_data:
```

#### Quick Commands
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Execute commands in backend container
docker-compose exec backend npm run db:sync
docker-compose exec backend npm test

# Stop and remove containers
docker-compose down

# Stop and remove with volumes
docker-compose down -v
```

### Manual Docker Build

If you prefer to build the Docker image manually:

```bash
# Build the image
docker build -t edvisory-backend .

# Run the container
docker run -p 3000:3000 --env-file .env edvisory-backend

# Run with database
docker run -p 3000:3000 \
  --env-file .env \
  --link postgres:postgres \
  edvisory-backend
```

### Docker Environment Variables

When using Docker, ensure these environment variables match your `docker-compose.yml`:

```env
# Database (for Docker)
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres123
DB_DATABASE=expense_tracker

# Server
PORT=3000
HOST=0.0.0.0
NODE_ENV=development
```



## 🔄 Version History

- **v1.0.0** - Initial implementation
  - Complete authentication system
  - Account and category management
  - Transaction tracking
  - Basic reporting features
  - Multi-language support
  - Security middleware implementation" 
