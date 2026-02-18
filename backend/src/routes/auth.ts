import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { User } from '../entities/User';
import { Device } from '../entities/Device';
import { AppDataSource } from '../config/database';
import { AuthUtils } from '../utils/auth';
import { ProfanityFilter } from '../utils/profanity-filter';
import { I18nUtils } from '../utils/i18n';
import { ApiResponse, AuthenticatedRequest } from '../types';
import { authMiddleware } from '../middleware/auth';

interface RegisterBody {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  language?: string;
}

interface LoginBody {
  username: string;
  password: string;
  deviceInfo: {
    userAgent: string;
    ip: string;
    deviceId: string;
  };
}

export async function authRoutes(fastify: FastifyInstance) {
  const userRepository = AppDataSource.getRepository(User);
  const deviceRepository = AppDataSource.getRepository(Device);

  // Register new user
  fastify.post<{ Body: RegisterBody }>('/register', async (request: FastifyRequest<{ Body: RegisterBody }>, reply: FastifyReply) => {
    try {
      const { username, email, password, firstName, lastName, language = 'en' } = request.body;

      // Check if user already exists
      const existingUser = await userRepository.findOne({
        where: [{ username }, { email }]
      });

      if (existingUser) {
        const response: ApiResponse = {
          success: false,
          message: I18nUtils.translate(existingUser.username === username ? 'auth.username_already_exists' : 'auth.email_already_exists', language),
          error: existingUser.username === username ? 'Username already exists' : 'Email already exists'
        };
        return reply.code(409).send(response);
      }

      // Hash password
      const hashedPassword = await AuthUtils.hashPassword(password);

      // Create new user
      const user = userRepository.create({
        username,
        email,
        password: hashedPassword,
        firstName: ProfanityFilter.filter(firstName),
        lastName: ProfanityFilter.filter(lastName),
        language
      });

      await userRepository.save(user);

      const response: ApiResponse = {
        success: true,
        message: I18nUtils.translate('auth.registration_success', language),
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          language: user.language
        }
      };

      return reply.code(201).send(response);

    } catch (error) {
      fastify.log.error(error);
      const response: ApiResponse = {
        success: false,
        message: I18nUtils.translate('general.server_error', 'en'),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      return reply.code(500).send(response);
    }
  });

  // Login user
  fastify.post<{ Body: LoginBody }>('/login', async (request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
    try {
      const { username, password, deviceInfo } = request.body;

      // Find user
      const user = await userRepository.findOne({
        where: { username, isActive: true }
      });

      if (!user) {
        const response: ApiResponse = {
          success: false,
          message: I18nUtils.translate('auth.invalid_credentials', 'en'),
          error: 'Invalid credentials'
        };
        return reply.code(401).send(response);
      }

      // Verify password
      const isValidPassword = await AuthUtils.verifyPassword(password, user.password);

      if (!isValidPassword) {
        const response: ApiResponse = {
          success: false,
          message: I18nUtils.translate('auth.invalid_credentials', user.language),
          error: 'Invalid credentials'
        };
        return reply.code(401).send(response);
      }

      // Parse device info
      const parsedDeviceInfo = AuthUtils.extractDeviceInfo(deviceInfo.userAgent, deviceInfo.ip);

      // Check if device already exists
      let device = await deviceRepository.findOne({
        where: { deviceId: deviceInfo.deviceId, user: { id: user.id } }
      });

      if (!device) {
        // Create new device
        device = deviceRepository.create({
          deviceId: deviceInfo.deviceId,
          userAgent: deviceInfo.userAgent,
          ipAddress: deviceInfo.ip,
          deviceName: `${parsedDeviceInfo.os} - ${parsedDeviceInfo.browser}`,
          deviceType: parsedDeviceInfo.deviceType,
          platform: parsedDeviceInfo.os,
          browser: parsedDeviceInfo.browser,
          user
        });
      } else {
        // Update existing device
        device.lastAccessAt = new Date();
        device.ipAddress = deviceInfo.ip;
        device.userAgent = deviceInfo.userAgent;
      }

      await deviceRepository.save(device);

      // Create session
      const sessionToken = await AuthUtils.createSession(user.id, { ...deviceInfo, deviceId: device.id });

      // Update last login
      user.lastLoginAt = new Date();
      await userRepository.save(user);

      const response: ApiResponse = {
        success: true,
        message: I18nUtils.translate('auth.login_success', user.language),
        data: {
          sessionToken,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            language: user.language
          },
          device: {
            id: device.id,
            deviceName: device.deviceName,
            deviceType: device.deviceType,
            platform: device.platform,
            browser: device.browser
          }
        }
      };

      return reply.send(response);

    } catch (error) {
      fastify.log.error(error);
      const response: ApiResponse = {
        success: false,
        message: I18nUtils.translate('general.server_error', 'en'),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      return reply.code(500).send(response);
    }
  });

  // Logout user
  fastify.post('/logout', {
    preHandler: authMiddleware
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const authedRequest = request as AuthenticatedRequest;
    try {
      const sessionToken = authedRequest.headers.authorization?.replace('Bearer ', '');

      if (sessionToken) {
        await AuthUtils.revokeSession(sessionToken);
      }

      const response: ApiResponse = {
        success: true,
        message: I18nUtils.translate('auth.logout_success', authedRequest.user?.language || 'en')
      };

      return reply.send(response);

    } catch (error) {
      fastify.log.error(error);
      const response: ApiResponse = {
        success: false,
        message: I18nUtils.translate('general.server_error', authedRequest.user?.language || 'en'),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      return reply.code(500).send(response);
    }
  });

  // Logout from all devices
  fastify.post('/logout-all', {
    preHandler: authMiddleware
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const authedRequest = request as AuthenticatedRequest;
    try {
      if (!authedRequest.user) {
        const response: ApiResponse = {
          success: false,
          message: I18nUtils.translate('general.unauthorized', 'en'),
          error: 'User not authenticated'
        };
        return reply.code(401).send(response);
      }

      await AuthUtils.revokeAllUserSessions(authedRequest.user.id);

      const response: ApiResponse = {
        success: true,
        message: I18nUtils.translate('general.deleted', authedRequest.user.language)
      };

      return reply.send(response);

    } catch (error) {
      fastify.log.error(error);
      const response: ApiResponse = {
        success: false,
        message: I18nUtils.translate('general.server_error', authedRequest.user?.language || 'en'),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      return reply.code(500).send(response);
    }
  });
}
