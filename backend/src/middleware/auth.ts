import { FastifyRequest, FastifyReply } from 'fastify';
import { AppDataSource } from '../config/database';
import { UserSession } from '../entities/UserSession';
import { User } from '../entities/User';

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({
        success: false,
        message: 'Unauthorized',
        error: 'Missing or invalid authorization header'
      });
    }

    const token = authHeader.replace('Bearer ', '');

    const sessionRepository = AppDataSource.getRepository(UserSession);
    const session = await sessionRepository.findOne({
      where: { session_token: token, is_active: true }
    });

    if (!session) {
      return reply.code(401).send({
        success: false,
        message: 'Unauthorized',
        error: 'Invalid or expired session'
      });
    }

    if (new Date() > session.expires_at) {
      session.is_active = false;
      await sessionRepository.save(session);
      return reply.code(401).send({
        success: false,
        message: 'Unauthorized',
        error: 'Session expired'
      });
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: session.user_id, isActive: true }
    });

    if (!user) {
      return reply.code(401).send({
        success: false,
        message: 'Unauthorized',
        error: 'User not found or inactive'
      });
    }

    session.last_accessed_at = new Date();
    await sessionRepository.save(session);

    (request as any).user = {
      id: user.id,
      username: user.username,
      email: user.email,
      language: user.language
    };
    (request as any).session = {
      id: session.id,
      token: session.session_token,
      expires_at: session.expires_at
    };
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
