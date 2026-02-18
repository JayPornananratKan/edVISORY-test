import { FastifyRequest, FastifyReply } from 'fastify';

// Store request start times in a map
const requestStartTimes = new Map<string, number>();

export async function requestLogger(request: FastifyRequest, reply: FastifyReply) {
  // Store start time for this request
  requestStartTimes.set(request.id, Date.now());
  
  // Log request start
  request.log.info({
    event: 'request_start',
    method: request.method,
    url: request.url,
    userAgent: request.headers['user-agent'],
    ip: request.ip,
    userId: (request as any).user?.id,
    requestId: request.id
  });
}

// Hook to log response
export async function responseLogger(request: FastifyRequest, reply: FastifyReply, payload: any) {
  const startTime = requestStartTimes.get(request.id);
  const duration = startTime ? Date.now() - startTime : 0;
  
  // Clean up the start time
  requestStartTimes.delete(request.id);
  
  request.log.info({
    event: 'request_end',
    method: request.method,
    url: request.url,
    statusCode: reply.statusCode,
    duration: `${duration}ms`,
    userId: (request as any).user?.id,
    requestId: request.id,
    responseSize: payload ? JSON.stringify(payload).length : 0
  });

  return payload;
}
