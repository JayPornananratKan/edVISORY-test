import { AuthService } from '../../services/AuthService';
import { User } from '../../entities/User';
import { Device } from '../../entities/Device';
import { UserSession } from '../../entities/UserSession';
import { AuthUtils } from '../../utils/auth';

// Mock the dependencies
jest.mock('../../config/database');
jest.mock('../../utils/auth');
jest.mock('../../utils/profanity-filter');
jest.mock('../../utils/i18n');

const mockUserRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  delete: jest.fn(),
};

const mockDeviceRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  delete: jest.fn(),
};

const mockSessionRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  delete: jest.fn(),
};

// Mock the database module
jest.mock('../../config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn().mockImplementation((entity) => {
      if (entity === User) return mockUserRepository;
      if (entity === Device) return mockDeviceRepository;
      if (entity === UserSession) return mockSessionRepository;
      return {};
    }),
  },
}));

// Mock I18nUtils
jest.mock('../../utils/i18n', () => ({
  I18nUtils: {
    translate: jest.fn((key: string, language: string) => {
      const translations: any = {
        'auth.invalid_credentials': {
          'en': 'Invalid credentials',
          'th': 'ข้อมูลไม่ถูกต้อง'
        },
        'auth.username_exists': {
          'en': 'User already exists',
          'th': 'ชื่อผู้ใช้งานมีอยู่แล้ว'
        },
        'auth.email_exists': {
          'en': 'Email already exists', 
          'th': 'อีเมลมีอยู่แล้ว'
        }
      };
      return translations[key]?.[language] || key;
    })
  }
}));

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
        language: 'en'
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue({
        id: 1,
        username: userData.username,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        language: userData.language,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockUserRepository.save.mockResolvedValue({ id: 1 });

      (AuthUtils.hashPassword as jest.Mock).mockResolvedValue('hashedPassword');

      const result = await authService.register(userData);

      expect(AuthUtils.hashPassword).toHaveBeenCalledWith(userData.password);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: [
          { username: userData.username },
          { email: userData.email }
        ]
      });
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
    });

    it('should throw error if username already exists', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      };

      mockUserRepository.findOne.mockResolvedValue({ id: 1, username: 'testuser' });

      await expect(authService.register(userData)).rejects.toThrow('User already exists');
    });

    it('should throw error if email already exists', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      };

      mockUserRepository.findOne.mockResolvedValue({ id: 1, email: 'test@example.com' });

      await expect(authService.register(userData)).rejects.toThrow('Email already exists');
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
          deviceId: 'device123'
        }
      };

      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedPassword',
        isActive: true,
        language: 'en'
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      (AuthUtils.verifyPassword as jest.Mock).mockResolvedValue(true);
      
      // Mock device operations
      mockDeviceRepository.findOne.mockResolvedValue(null);
      mockDeviceRepository.create.mockReturnValue({
        id: 1,
        user: mockUser,
        deviceId: loginData.deviceInfo.deviceId,
        userAgent: loginData.deviceInfo.userAgent,
        ipAddress: loginData.deviceInfo.ip,
        isActive: true
      });
      mockDeviceRepository.save.mockResolvedValue({ id: 1 });

      // Mock session creation
      (AuthUtils.createSession as jest.Mock).mockResolvedValue({
        token: 'sessionToken',
        expiresAt: new Date()
      });

      const result = await authService.login(loginData);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { username: loginData.username, isActive: true }
      });
      expect(AuthUtils.verifyPassword).toHaveBeenCalledWith(loginData.password, mockUser.password);
      expect(result).toBeDefined();
      expect(result.user.id).toBe(1);
      expect(result.session_token).toBe('sessionToken');
    });

    it('should throw error for invalid credentials', async () => {
      const loginData = {
        username: 'testuser',
        password: 'wrongpassword',
        deviceInfo: {
          userAgent: 'Mozilla/5.0...',
          ip: '192.168.1.1',
          deviceId: 'device123'
        }
      };

      mockUserRepository.findOne.mockResolvedValue({
        id: 1,
        username: 'testuser',
        password: 'hashedPassword',
        isActive: true,
        language: 'en'
      });
      (AuthUtils.verifyPassword as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(loginData)).rejects.toThrow('Invalid credentials');
    });


    it('should throw error if user not found', async () => {
      const loginData = {
        username: 'nonexistent',
        password: 'Password123!',
        deviceInfo: {
          userAgent: 'Mozilla/5.0...',
          ip: '192.168.1.1',
          deviceId: 'device123'
        }
      };

      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(authService.login(loginData)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const sessionToken = 'sessionToken';

      await authService.logout(sessionToken);

      expect(AuthUtils.revokeSession).toHaveBeenCalledWith(sessionToken);
    });
  });

  describe('logoutAll', () => {
    it('should logout from all devices', async () => {
      const userId = 1;

      await authService.logoutAll(userId);

      expect(AuthUtils.revokeAllUserSessions).toHaveBeenCalledWith(userId);
    });
  });

  describe('validateSession', () => {
    it('should validate active session', async () => {
      const sessionToken = 'sessionToken';
      const mockSession = {
        id: 1,
        user_id: 1,
        session_token: sessionToken,
        expires_at: new Date(Date.now() + 3600000),
        is_active: true,
      };
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        language: 'en'
      };

      mockSessionRepository.findOne.mockResolvedValue(mockSession);
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await authService.validateSession(sessionToken);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('session');
      expect(result.user.id).toBe(1);
      expect(result.session.token).toBe(sessionToken);
    });

    it('should reject expired session', async () => {
      const sessionToken = 'sessionToken';
      const mockSession = {
        id: 1,
        user_id: 1,
        session_token: sessionToken,
        expires_at: new Date(Date.now() - 3600000),
        is_active: true,
      };

      mockSessionRepository.findOne.mockResolvedValue(mockSession);

      await expect(authService.validateSession(sessionToken)).rejects.toThrow('Session expired');
    });

    it('should reject non-existent session', async () => {
      const sessionToken = 'nonexistentToken';

      mockSessionRepository.findOne.mockResolvedValue(null);

      await expect(authService.validateSession(sessionToken)).rejects.toThrow('Invalid or expired session');
    });
  });

  describe('getUserProfile', () => {
    it('should get user profile', async () => {
      const userId = 1;
      const mockUser = {
        id: userId,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        language: 'en',
        timezone: 'UTC',
        isActive: true,
        lastLoginAt: new Date(),
        createdAt: new Date()
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await authService.getUserProfile(userId);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId, isActive: true }
      });
      expect(result).toEqual({
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        language: mockUser.language,
        timezone: mockUser.timezone,
        isActive: mockUser.isActive,
        lastLoginAt: mockUser.lastLoginAt,
        createdAt: mockUser.createdAt
      });
    });

    it('should throw error if user not found', async () => {
      const userId = 999;

      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(authService.getUserProfile(userId)).rejects.toThrow('User not found');
    });
  });
});
