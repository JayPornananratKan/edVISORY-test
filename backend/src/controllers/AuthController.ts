import { FastifyInstance, FastifyReply } from 'fastify';
import { User } from '../entities/User';
import { Device } from '../entities/Device';
import { AppDataSource } from '../config/database';
import { AuthUtils } from '../utils/auth';
import { ProfanityFilter } from '../utils/profanity-filter';
import { I18nUtils } from '../utils/i18n';
import { ApiResponse, AuthenticatedRequest } from '../types';

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

export class AuthController {
  private userRepository = AppDataSource.getRepository(User);
  private deviceRepository = AppDataSource.getRepository(Device);

  async register(request: any, reply: FastifyReply) {
    try {
      const { username, email, password, firstName, lastName, language = 'en' }: RegisterBody = request.body;

      // Check if user already exists
      const existingUser = await this.userRepository.findOne({
        where: [
          { username },
          { email }
        ]
      });

      if (existingUser) {
        const response: ApiResponse = {
          success: false,
          message: existingUser.username === username 
            ? I18nUtils.translate('auth.username_exists', language)
            : I18nUtils.translate('auth.email_exists', language)
        };
        return reply.code(409).send(response);
      }

      // Filter profanity
      const filteredFirstName = ProfanityFilter.filter(firstName);
      const filteredLastName = ProfanityFilter.filter(lastName);

      // Hash password
      const hashedPassword = await AuthUtils.hashPassword(password);

      // Create user
      const user = this.userRepository.create({
        username,
        email,
        password: hashedPassword,
        firstName: filteredFirstName,
        lastName: filteredLastName,
        language,
        isActive: true
      });

      await this.userRepository.save(user);

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
      request.log.error(error);
      const response: ApiResponse = {
        success: false,
        message: I18nUtils.translate('general.server_error', 'en'),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      return reply.code(500).send(response);
    }
  }

  async login(request: any, reply: FastifyReply) {
    try {
      const { username, password, deviceInfo }: LoginBody = request.body;

      // Find user
      const user = await this.userRepository.findOne({
        where: { username, isActive: true }
      });

      if (!user) {
        const response: ApiResponse = {
          success: false,
          message: I18nUtils.translate('auth.invalid_credentials', 'en')
        };
        return reply.code(401).send(response);
      }

      // Verify password
      const isValidPassword = await AuthUtils.verifyPassword(password, user.password);
      if (!isValidPassword) {
        const response: ApiResponse = {
          success: false,
          message: I18nUtils.translate('auth.invalid_credentials', user.language)
        };
        return reply.code(401).send(response);
      }

      // Create or update device
      let device = await this.deviceRepository.findOne({
        where: { user: { id: user.id }, deviceId: deviceInfo.deviceId }
      });

      if (device) {
        device.userAgent = deviceInfo.userAgent;
        device.ipAddress = deviceInfo.ip;
        device.lastAccessAt = new Date();
        await this.deviceRepository.save(device);
      } else {
        device = this.deviceRepository.create({
          user: user,
          deviceId: deviceInfo.deviceId,
          userAgent: deviceInfo.userAgent,
          ipAddress: deviceInfo.ip,
          isActive: true
        });
        await this.deviceRepository.save(device);
      }

      // Create session token
      const sessionToken = AuthUtils.generateSessionToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // Store session
      await AuthUtils.createSession(user.id, { deviceId: deviceInfo.deviceId });

      // Update last login
      user.lastLoginAt = new Date();
      await this.userRepository.save(user);

      const response: ApiResponse = {
        success: true,
        message: I18nUtils.translate('auth.login_success', user.language),
        data: {
          session_token: sessionToken,
          expires_at: expiresAt.toISOString(),
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            language: user.language
          }
        }
      };

      return reply.send(response);

    } catch (error) {
      request.log.error(error);
      const response: ApiResponse = {
        success: false,
        message: I18nUtils.translate('general.server_error', 'en'),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      return reply.code(500).send(response);
    }
  }

  async logout(authedRequest: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const token = authedRequest.headers.authorization?.replace('Bearer ', '');
      
      if (token) {
        await AuthUtils.revokeSession(token);
      }

      const response: ApiResponse = {
        success: true,
        message: I18nUtils.translate('auth.logout_success', authedRequest.user.language)
      };

      return reply.send(response);

    } catch (error) {
      authedRequest.log.error(error);
      const response: ApiResponse = {
        success: false,
        message: I18nUtils.translate('general.server_error', authedRequest.user.language),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      return reply.code(500).send(response);
    }
  }

  async logoutAll(authedRequest: AuthenticatedRequest, reply: FastifyReply) {
    try {
      await AuthUtils.revokeAllUserSessions(authedRequest.user.id);

      const response: ApiResponse = {
        success: true,
        message: I18nUtils.translate('auth.logout_all_success', authedRequest.user.language)
      };

      return reply.send(response);

    } catch (error) {
      authedRequest.log.error(error);
      const response: ApiResponse = {
        success: false,
        message: I18nUtils.translate('general.server_error', authedRequest.user.language),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      return reply.code(500).send(response);
    }
  }

  async getProfile(authedRequest: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const response: ApiResponse = {
        success: true,
        data: {
          id: authedRequest.user.id,
          username: authedRequest.user.username,
          email: authedRequest.user.email,
          firstName: (authedRequest.user as any).firstName,
          lastName: (authedRequest.user as any).lastName,
          language: authedRequest.user.language,
          timezone: (authedRequest.user as any).timezone,
          isActive: (authedRequest.user as any).isActive,
          lastLoginAt: (authedRequest.user as any).lastLoginAt,
          createdAt: (authedRequest.user as any).createdAt
        }
      };

      return reply.send(response);

    } catch (error) {
      authedRequest.log.error(error);
      const response: ApiResponse = {
        success: false,
        message: I18nUtils.translate('general.server_error', authedRequest.user.language),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      return reply.code(500).send(response);
    }
  }
}
