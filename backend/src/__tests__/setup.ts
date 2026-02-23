import { AppDataSource } from '../config/database';

// Mock database connection for tests
jest.mock('../config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
    createQueryRunner: jest.fn(),
    manager: {
      query: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_USERNAME = 'test';
process.env.DB_PASSWORD = 'test';
process.env.DB_DATABASE = 'test_expense_tracker';
process.env.JWT_SECRET = 'test-jwt-secret';

// Global test setup
beforeAll(async () => {
  // Setup test database connection if needed
});

afterAll(async () => {
  // Cleanup test database connection if needed
});

beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
});
