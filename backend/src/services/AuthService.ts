import { User } from '../entities/User';
import { Device } from '../entities/Device';
import { UserSession } from '../entities/UserSession';
import { AppDataSource } from '../config/database';
import { AuthUtils } from '../utils/auth';
import { ProfanityFilter } from '../utils/profanity-filter';
import { I18nUtils } from '../utils/i18n';

interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  language?: string;
}

interface LoginData {
  username: string;
  password: string;
  deviceInfo: {
    userAgent: string;
    ip: string;
    deviceId: string;
  };
}

interface DeviceInfo {
  userAgent: string;
  ip: string;
  deviceId: string;
}

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);
  private deviceRepository = AppDataSource.getRepository(Device);
  private sessionRepository = AppDataSource.getRepository(UserSession);

  async register(userData: RegisterData) {
    const { username, email, password, firstName, lastName, language = 'en' } = userData;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: [
        { username },
        { email }
      ]
    });

    if (existingUser) {
      throw new Error(
        existingUser.username === username 
          ? I18nUtils.translate('auth.username_exists', language)
          : I18nUtils.translate('auth.email_exists', language)
      );
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

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      language: user.language
    };
  }

  async login(loginData: LoginData) {
    const { username, password, deviceInfo } = loginData;

    // Find user
    const user = await this.userRepository.findOne({
      where: { username, isActive: true }
    });

    if (!user) {
      throw new Error(I18nUtils.translate('auth.invalid_credentials', 'en'));
    }

    // Verify password
    const isValidPassword = await AuthUtils.verifyPassword(password, user.password);
    if (!isValidPassword) {
      throw new Error(I18nUtils.translate('auth.invalid_credentials', user.language));
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

    // Create session token and store it
    const { token: sessionToken, expiresAt } = await AuthUtils.createSession(user.id, { deviceId: deviceInfo.deviceId });

    // Update last login
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    return {
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
    };
  }

  async logout(token: string) {
    if (token) {
      await AuthUtils.revokeSession(token);
    }
  }

  async logoutAll(userId: number) {
    await AuthUtils.revokeAllUserSessions(userId);
  }

  async getUserProfile(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      language: user.language,
      timezone: user.timezone,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt
    };
  }

  async validateSession(token: string) {
    const session = await this.sessionRepository.findOne({
      where: { session_token: token, is_active: true }
    });

    if (!session) {
      throw new Error('Invalid or expired session');
    }

    if (new Date() > session.expires_at) {
      session.is_active = false;
      await this.sessionRepository.save(session);
      throw new Error('Session expired');
    }

    const user = await this.userRepository.findOne({
      where: { id: session.user_id, isActive: true }
    });

    if (!user) {
      throw new Error('User not found or inactive');
    }

    // Update last accessed
    session.last_accessed_at = new Date();
    await this.sessionRepository.save(session);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        language: user.language
      },
      session: {
        id: session.id,
        token: session.session_token,
        expires_at: session.expires_at
      }
    };
  }
}
