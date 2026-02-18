import { FastifyRequest, FastifyReply } from 'fastify';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { RateLimitError } from './error-handler';

// Create rate limiters for different endpoints
const authLimiter = new RateLimiterMemory({
  points: 5, // Number of requests
  duration: 900, // Per 15 minutes
  blockDuration: 900, // Block for 15 minutes
});

const generalLimiter = new RateLimiterMemory({
  points: 100, // Number of requests
  duration: 60, // Per 1 minute
  blockDuration: 60, // Block for 1 minute
});

const uploadLimiter = new RateLimiterMemory({
  points: 10, // Number of uploads
  duration: 3600, // Per 1 hour
  blockDuration: 3600, // Block for 1 hour
});

const exportLimiter = new RateLimiterMemory({
  points: 5, // Number of exports
  duration: 3600, // Per 1 hour
  blockDuration: 3600, // Block for 1 hour
});

export async function rateLimiter(request: FastifyRequest, reply: FastifyReply) {
  let limiter = generalLimiter;
  let key: string;
  
  // Select appropriate limiter and key based on route
  if (request.url.includes('/auth/login') || request.url.includes('/auth/register')) {
    limiter = authLimiter;
    key = request.ip;
  } else if (request.url.includes('/upload') || request.url.includes('/attachments')) {
    limiter = uploadLimiter;
    key = (request as any).user?.id || request.ip;
  } else if (request.url.includes('/export')) {
    limiter = exportLimiter;
    key = (request as any).user?.id || request.ip;
  } else {
    key = request.ip;
  }

  try {
    await limiter.consume(key);
  } catch (rejRes: any) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    reply.header('X-RateLimit-Limit', limiter.points);
    reply.header('X-RateLimit-Remaining', 0);
    reply.header('X-RateLimit-Reset', new Date(Date.now() + secs * 1000).toISOString());
    
    throw new RateLimitError(`Rate limit exceeded. Try again in ${secs} seconds.`);
  }

  // Add rate limit headers to successful responses
  const res = await limiter.get(key);
  if (res) {
    reply.header('X-RateLimit-Limit', limiter.points);
    reply.header('X-RateLimit-Remaining', res.remainingPoints);
    reply.header('X-RateLimit-Reset', new Date(Date.now() + res.msBeforeNext).toISOString());
  }
}
