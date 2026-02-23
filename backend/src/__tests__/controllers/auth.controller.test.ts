import { AuthController } from '../../controllers/AuthController';
import { AuthService } from '../../services/AuthService';
import { FastifyReply } from 'fastify';

// Mock dependencies
jest.mock('../../services/AuthService');
jest.mock('../../utils/i18n');

describe('AuthController', () => {
  let authController: AuthController;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockReply: jest.Mocked<FastifyReply>;

  beforeEach(() => {
    jest.clearAllMocks();
    authController = new AuthController();
    mockAuthService = AuthService.prototype as jest.Mocked<AuthService>;
    mockReply = {
      code: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    } as any;
  });

  describe('register', () => {
    it('should register user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
        language: 'en',
      };

      const mockRequest = {
        body: userData,
        log: {
          error: jest.fn(),
        },
      };

      const mockUser = {
        id: 1,
        username: userData.username,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        language: userData.language,
      };

      mockAuthService.register.mockResolvedValue(mockUser);

      await authController.register(mockRequest as any, mockReply);

      expect(mockAuthService.register).toHaveBeenCalledWith(userData);
      expect(mockReply.code).toHaveBeenCalledWith(201);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        message: 'Registration successful',
        data: mockUser,
      });
    });

    it('should handle registration errors', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      };

      const mockRequest = {
        body: userData,
        log: {
          error: jest.fn(),
        },
      };

      const error = new Error('Username already exists');
      mockAuthService.register.mockRejectedValue(error);

      await authController.register(mockRequest as any, mockReply);

      expect(mockRequest.log.error).toHaveBeenCalledWith(error);
      expect(mockReply.code).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
        error: 'Username already exists',
      });
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const loginData = {
        username: 'testuser',
        password: 'Password123!',
        deviceInfo: {
          userAgent: 'Mozilla/5.0...',
          ip: '192.168.1.1',
          deviceId: 'device123',
        },
      };

      const mockRequest = {
        body: loginData,
        log: {
          error: jest.fn(),
        },
      };

      const mockLoginResult = {
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          language: 'en',
        },
        session_token: 'sessionToken123',
        expires_at: new Date().toISOString(),
      };

      mockAuthService.login.mockResolvedValue(mockLoginResult);

      await authController.login(mockRequest as any, mockReply);

      expect(mockAuthService.login).toHaveBeenCalledWith(loginData);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        message: 'Login successful',
        data: mockLoginResult,
      });
    });

    it('should handle login errors', async () => {
      const loginData = {
        username: 'testuser',
        password: 'wrongpassword',
        deviceInfo: {
          userAgent: 'Mozilla/5.0...',
          ip: '192.168.1.1',
          deviceId: 'device123',
        },
      };

      const mockRequest = {
        body: loginData,
        log: {
          error: jest.fn(),
        },
      };

      const error = new Error('Invalid credentials');
      mockAuthService.login.mockRejectedValue(error);

      await authController.login(mockRequest as any, mockReply);

      expect(mockRequest.log.error).toHaveBeenCalledWith(error);
      expect(mockReply.code).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid credentials',
        error: 'Invalid credentials',
      });
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer sessionToken123',
        },
        log: {
          error: jest.fn(),
        },
      };

      mockAuthService.logout.mockResolvedValue(undefined);

      await authController.logout(mockRequest as any, mockReply);

      expect(mockAuthService.logout).toHaveBeenCalledWith('sessionToken123');
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        message: 'Logout successful',
      });
    });

    it('should handle logout errors', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer invalidToken',
        },
        log: {
          error: jest.fn(),
        },
      };

      mockAuthService.logout.mockRejectedValue(new Error('Session not found'));

      await authController.logout(mockRequest as any, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'Session not found',
        error: 'Session not found',
      });
    });
  });

  describe('logoutAll', () => {
    it('should logout from all devices successfully', async () => {
      const mockAuthedRequest = {
        user: {
          id: 1,
          language: 'en',
        },
        log: {
          error: jest.fn(),
        },
      };

      mockAuthService.logoutAll.mockResolvedValue(undefined);

      await authController.logoutAll(mockAuthedRequest as any, mockReply);

      expect(mockAuthService.logoutAll).toHaveBeenCalledWith(1);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        message: 'Logged out from all devices successfully',
      });
    });

    it('should handle logoutAll errors', async () => {
      const mockAuthedRequest = {
        user: {
          id: 1,
          language: 'en',
        },
        log: {
          error: jest.fn(),
        },
      };

      mockAuthService.logoutAll.mockRejectedValue(new Error('Database error'));

      await authController.logoutAll(mockAuthedRequest as any, mockReply);

      expect(mockAuthedRequest.log.error).toHaveBeenCalled();
      expect(mockReply.code).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
        error: 'Database error',
      });
    });
  });

  describe('getProfile', () => {
    it('should get user profile successfully', async () => {
      const mockAuthedRequest = {
        user: {
          id: 1,
          language: 'en',
        },
        log: {
          error: jest.fn(),
        },
      };

      const mockProfile = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        language: 'en',
        timezone: 'UTC',
        isActive: true,
        lastLoginAt: new Date(),
        createdAt: new Date(),
      };

      mockAuthService.getUserProfile.mockResolvedValue(mockProfile);

      await authController.getProfile(mockAuthedRequest as any, mockReply);

      expect(mockAuthService.getUserProfile).toHaveBeenCalledWith(1);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: mockProfile,
      });
    });

    it('should handle getProfile errors', async () => {
      const mockAuthedRequest = {
        user: {
          id: 1,
          language: 'en',
        },
        log: {
          error: jest.fn(),
        },
      };

      mockAuthService.getUserProfile.mockRejectedValue(new Error('User not found'));

      await authController.getProfile(mockAuthedRequest as any, mockReply);

      expect(mockAuthedRequest.log.error).toHaveBeenCalled();
      expect(mockReply.code).toHaveBeenCalledWith(404);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'User not found',
        error: 'User not found',
      });
    });
  });
});
