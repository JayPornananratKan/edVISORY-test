import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../config/database';
import { UserSession } from '../entities/UserSession';

export class AuthUtils {
  private static readonly SALT_ROUNDS = 12;
  private static readonly SESSION_DURATION_HOURS = 24;

  // Password hashing
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Session management
  static generateSessionToken(): string {
    return uuidv4() + '-' + Date.now();
  }

  static generateDeviceId(): string {
    return uuidv4();
  }

  static calculateSessionExpiry(): Date {
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + this.SESSION_DURATION_HOURS);
    return expiry;
  }

  static isSessionExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt;
  }

  // Device fingerprinting
  static extractDeviceInfo(userAgent: string, ip: string): {
    deviceType: string;
    browser: string;
    os: string;
  } {
    const ua = userAgent.toLowerCase();
    
    // Detect device type
    let deviceType = 'desktop';
    if (/mobile|android|iphone|ipad|phone/i.test(ua)) {
      deviceType = /tablet|ipad/i.test(ua) ? 'tablet' : 'mobile';
    }

    // Detect browser
    let browser = 'unknown';
    if (ua.includes('chrome')) browser = 'chrome';
    else if (ua.includes('firefox')) browser = 'firefox';
    else if (ua.includes('safari')) browser = 'safari';
    else if (ua.includes('edge')) browser = 'edge';
    else if (ua.includes('opera')) browser = 'opera';

    // Detect OS
    let os = 'unknown';
    if (ua.includes('windows')) os = 'windows';
    else if (ua.includes('mac')) os = 'macos';
    else if (ua.includes('linux')) os = 'linux';
    else if (ua.includes('android')) os = 'android';
    else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'ios';

    return { deviceType, browser, os };
  }

  // Generate device name from user agent
  static generateDeviceName(userAgent: string): string {
    const { deviceType, browser, os } = this.extractDeviceInfo(userAgent, '');
    
    const browserName = browser.charAt(0).toUpperCase() + browser.slice(1);
    const osName = os.charAt(0).toUpperCase() + os.slice(1);
    
    return `${browserName} on ${osName} (${deviceType})`;
  }

  // Validate session token format
  static isValidSessionToken(token: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const parts = token.split('-');
    
    return parts.length === 2 && 
           uuidRegex.test(parts[0]) && 
           !isNaN(parseInt(parts[1]));
  }

  // Rate limiting helpers
  static generateRateLimitKey(identifier: string, action: string): string {
    return `rate_limit:${action}:${identifier}`;
  }

  // Password strength validation
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= 8) score += 1;
    else feedback.push('Password should be at least 8 characters long');

    // Uppercase check
    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Include uppercase letters');

    // Lowercase check
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Include lowercase letters');

    // Number check
    if (/\d/.test(password)) score += 1;
    else feedback.push('Include numbers');

    // Special character check
    if (/[@$!%*?&]/.test(password)) score += 1;
    else feedback.push('Include special characters (@$!%*?&)');

    // Common patterns check
    if (!/(.)\1{2,}/.test(password)) score += 1; // No repeated characters
    else feedback.push('Avoid repeated characters');

    if (!/123|abc|qwe|password/i.test(password)) score += 1; // No common patterns
    else feedback.push('Avoid common patterns like "123", "abc", "password"');

    return {
      isValid: score >= 5,
      score: Math.min(score, 6),
      feedback
    };
  }

  // Generate secure random string
  static generateSecureRandomString(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  // Check if password should be reset based on last change
  static shouldResetPassword(lastChanged: Date, maxDays: number = 90): boolean {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastChanged.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > maxDays;
  }

  // Sanitize user input for authentication
  static sanitizeAuthInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .slice(0, 255); // Limit length
  }

  // Generate logout all devices token
  static generateGlobalLogoutToken(userId: number): string {
    const payload = `${userId}-${Date.now()}-${this.generateSecureRandomString(16)}`;
    return Buffer.from(payload).toString('base64');
  }

  // Validate global logout token
  static validateGlobalLogoutToken(token: string): { userId: number; timestamp: number } | null {
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      const parts = decoded.split('-');
      
      if (parts.length !== 3) return null;
      
      const userId = parseInt(parts[0]);
      const timestamp = parseInt(parts[1]);
      
      if (isNaN(userId) || isNaN(timestamp)) return null;
      
      // Token expires after 1 hour
      const now = Date.now();
      if (now - timestamp > 3600000) return null;
      
      return { userId, timestamp };
    } catch {
      return null;
    }
  }

  // Session management
  static async createSession(userId: number, deviceInfo: { deviceId: number | string; [key: string]: any }): Promise<string> {
    const sessionRepository = AppDataSource.getRepository(UserSession);
    const token = this.generateSessionToken();
    const expiresAt = this.calculateSessionExpiry();

    const session = sessionRepository.create({
      user_id: userId,
      device_id: typeof deviceInfo.deviceId === 'number' ? deviceInfo.deviceId : 0,
      session_token: token,
      expires_at: expiresAt,
      is_active: true
    });

    await sessionRepository.save(session);
    return token;
  }

  static async revokeSession(token: string): Promise<void> {
    const sessionRepository = AppDataSource.getRepository(UserSession);
    await sessionRepository.update(
      { session_token: token },
      { is_active: false }
    );
  }

  static async revokeAllUserSessions(userId: number): Promise<void> {
    const sessionRepository = AppDataSource.getRepository(UserSession);
    await sessionRepository.update(
      { user_id: userId },
      { is_active: false }
    );
  }
}
