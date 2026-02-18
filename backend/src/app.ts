import dotenv from 'dotenv';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import { initializeDatabase } from './config/database';
import { registerRoutes } from './routes';
import { errorHandler } from './middleware/error-handler';
import { requestLogger, responseLogger } from './middleware/request-logger';
import { rateLimiter } from './middleware/rate-limiter';
import { I18nUtils } from './utils/i18n';

// Load environment variables
dotenv.config();

// Create Fastify instance
const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV === 'development' ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    } : undefined
  }
});

// Register plugins
async function registerPlugins() {
  // CORS configuration
  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
  });

  // Security headers
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"]
      }
    }
  });

  // File upload support
  await fastify.register(multipart);
}

// Register routes
async function registerAppRoutes() {
  // Register all routes through index
  await registerRoutes(fastify);
}

// Register middleware
async function registerMiddleware() {
  // Request logging
  fastify.addHook('preHandler', requestLogger);
  fastify.addHook('onSend', responseLogger);
  
  // Rate limiting
  fastify.addHook('preHandler', rateLimiter);
  
  // Error handling
  fastify.setErrorHandler(errorHandler);
  
  // Set default language for requests
  fastify.addHook('preHandler', async (request, reply) => {
    const language = I18nUtils.getLanguageFromHeaders(request.headers['accept-language']);
    (request as any).language = language;
  });
}

// Graceful shutdown
async function gracefulShutdown() {
  try {
    await fastify.close();
    console.log(' Server closed gracefully');
    console.log('🔌 Server closed gracefully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during server shutdown:', error);
    process.exit(1);
  }
}

// Start server
async function start() {
  try {
    // Initialize database
    await initializeDatabase();
    
    // Register plugins, routes, and middleware
    await registerPlugins();
    await registerMiddleware();
    await registerAppRoutes();
    
    // Start listening
    const port = parseInt(process.env.PORT || '3000');
    const host = process.env.HOST || 'localhost';
    
    await fastify.listen({ port, host });
    
    console.log(`🚀 Server running on http://${host}:${port}`);
    console.log(`📚 API Documentation: http://${host}:${port}/api-docs`);
    console.log(`🏥 Health Check: http://${host}:${port}/health`);
    
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  gracefulShutdown();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown();
});

// Start the server
if (require.main === module) {
  start();
}

export default fastify;