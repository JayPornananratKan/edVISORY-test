import { FastifyInstance, FastifyReply } from 'fastify';
import { AuthService } from '../services/AuthService';
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
  private authService = new AuthService();

  private t(key: any, language: string, fallback: string): string {
    return I18nUtils.translate(key, language) || fallback;
  }

  async register(request: any, reply: FastifyReply) {
    try {
      const userData: RegisterBody = request.body;
      const user = await this.authService.register(userData);

      const response: ApiResponse = {
        success: true,
        message: this.t('auth.registration_success', userData.language || 'en', 'Registration successful'),
        data: user
      };

      return reply.code(201).send(response);

    } catch (error) {
      request.log.error(error);
      const response: ApiResponse = {
        success: false,
        message: this.t('general.server_error', 'en', 'Internal server error'),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      return reply.code(500).send(response);
    }
  }

  async login(request: any, reply: FastifyReply) {
    try {
      const loginData: LoginBody = request.body;
      const result = await this.authService.login(loginData);

      const response: ApiResponse = {
        success: true,
        message: this.t('auth.login_success', 'en', 'Login successful'),
        data: result
      };

      return reply.send(response);

    } catch (error) {
      request.log.error(error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isInvalidCredentials = errorMessage.toLowerCase().includes('invalid credentials');

      const response: ApiResponse = {
        success: false,
        message: isInvalidCredentials ? 'Invalid credentials' : this.t('general.server_error', 'en', 'Internal server error'),
        error: errorMessage
      };
      return reply.code(isInvalidCredentials ? 401 : 500).send(response);
    }
  }

  async logout(authedRequest: AuthenticatedRequest, reply: FastifyReply) {
    const language = authedRequest.user?.language || 'en';

    try {
      const token = authedRequest.headers.authorization?.replace('Bearer ', '') || '';
      
      await this.authService.logout(token);

      const response: ApiResponse = {
        success: true,
        message: this.t('auth.logout_success', language, 'Logout successful')
      };

      return reply.send(response);

    } catch (error) {
      authedRequest.log.error(error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isSessionError = errorMessage.toLowerCase().includes('session');

      const response: ApiResponse = {
        success: false,
        message: isSessionError ? 'Session not found' : this.t('general.server_error', language, 'Internal server error'),
        error: errorMessage
      };
      return reply.code(isSessionError ? 401 : 500).send(response);
    }
  }

  async logoutAll(authedRequest: AuthenticatedRequest, reply: FastifyReply) {
    const language = authedRequest.user?.language || 'en';

    try {
      await this.authService.logoutAll(authedRequest.user.id);

      const response: ApiResponse = {
        success: true,
        message: this.t('auth.logout_all_success', language, 'Logged out from all devices successfully')
      };

      return reply.send(response);

    } catch (error) {
      authedRequest.log.error(error);
      const response: ApiResponse = {
        success: false,
        message: this.t('general.server_error', language, 'Internal server error'),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      return reply.code(500).send(response);
    }
  }

  async getProfile(authedRequest: AuthenticatedRequest, reply: FastifyReply) {
    const language = authedRequest.user?.language || 'en';

    try {
      const profile = await this.authService.getUserProfile(authedRequest.user.id);

      const response: ApiResponse = {
        success: true,
        data: profile
      };

      return reply.send(response);

    } catch (error) {
      authedRequest.log.error(error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isNotFound = errorMessage.toLowerCase().includes('not found');

      const response: ApiResponse = {
        success: false,
        message: isNotFound ? 'User not found' : this.t('general.server_error', language, 'Internal server error'),
        error: errorMessage
      };
      return reply.code(isNotFound ? 404 : 500).send(response);
    }
  }
}
