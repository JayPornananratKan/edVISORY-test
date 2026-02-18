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

  async register(request: any, reply: FastifyReply) {
    try {
      const userData: RegisterBody = request.body;
      const user = await this.authService.register(userData);

      const response: ApiResponse = {
        success: true,
        message: I18nUtils.translate('auth.registration_success', userData.language || 'en'),
        data: user
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
      const loginData: LoginBody = request.body;
      const result = await this.authService.login(loginData);

      const response: ApiResponse = {
        success: true,
        message: I18nUtils.translate('auth.login_success', 'en'),
        data: result
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
      const token = authedRequest.headers.authorization?.replace('Bearer ', '') || '';
      
      await this.authService.logout(token);

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
      await this.authService.logoutAll(authedRequest.user.id);

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
      const profile = await this.authService.getUserProfile(authedRequest.user.id);

      const response: ApiResponse = {
        success: true,
        data: profile
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
