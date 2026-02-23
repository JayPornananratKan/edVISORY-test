import { FastifyRequest, FastifyReply } from 'fastify';
import { ValidationSchemas } from '../config/validation';
import { ObjectSchema } from 'joi';

export interface ValidationOptions {
  body?: keyof typeof ValidationSchemas;
  query?: keyof typeof ValidationSchemas;
  params?: keyof typeof ValidationSchemas;
}

export function validate(schemaName: keyof typeof ValidationSchemas, options: ValidationOptions = {}) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Validate body
      if (options.body && request.body) {
        const schema = ValidationSchemas[options.body] as ObjectSchema;
        if (schema) {
          const { error } = schema.validate(request.body);
          if (error) {
            reply.status(400).send({
              error: 'Validation Error',
              message: error.details[0].message,
              details: error.details
            });
            return;
          }
        }
      }

      // Validate query parameters
      if (options.query && request.query) {
        const schema = ValidationSchemas[options.query] as ObjectSchema;
        if (schema) {
          const { error } = schema.validate(request.query);
          if (error) {
            reply.status(400).send({
              error: 'Validation Error',
              message: error.details[0].message,
              details: error.details
            });
            return;
          }
        }
      }

      // Validate route parameters
      if (options.params && request.params) {
        const schema = ValidationSchemas[options.params] as ObjectSchema;
        if (schema) {
          const { error } = schema.validate(request.params);
          if (error) {
            reply.status(400).send({
              error: 'Validation Error',
              message: error.details[0].message,
              details: error.details
            });
            return;
          }
        }
      }
    } catch (err) {
      reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Validation middleware error'
      });
    }
  };
}

// Predefined validation configurations for common endpoints
export const ValidationConfig = {
  // Auth endpoints
  register: { body: 'register' as const },
  login: { body: 'login' as const },
  
  // Account endpoints
  createAccount: { body: 'createAccount' as const },
  updateAccount: { body: 'updateAccount' as const, params: 'id' as const },
  getAccount: { params: 'id' as const },
  deleteAccount: { params: 'id' as const },
  getAccounts: { query: 'pagination' as const },
  
  // Category endpoints
  createCategory: { body: 'createCategory' as const },
  updateCategory: { body: 'updateCategory' as const, params: 'id' as const },
  getCategory: { params: 'id' as const },
  deleteCategory: { params: 'id' as const },
  getCategories: { query: 'pagination' as const },
  
  // Transaction endpoints
  createTransaction: { body: 'createTransaction' as const },
  updateTransaction: { body: 'updateTransaction' as const, params: 'id' as const },
  getTransaction: { params: 'id' as const },
  deleteTransaction: { params: 'id' as const },
  getTransactions: { query: 'transactionQuery' as const },
  
  // Report endpoints
  transactionSummary: { query: 'transactionSummaryQuery' as const },
  dailySpending: { query: 'dailySpendingQuery' as const },
  accountSummary: { query: 'accountSummaryQuery' as const },
  categorySpending: { query: 'categorySpendingQuery' as const }
};
