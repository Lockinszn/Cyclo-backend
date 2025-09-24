import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * Crypto utilities for password hashing and secure token generation
 */
export class CryptoUtils {
  private static readonly SALT_ROUNDS = 12;
  private static readonly TOKEN_LENGTH = 32;

  /**
   * Hash a password using bcrypt with 12 salt rounds
   * @param password - Plain text password to hash
   * @returns Promise<string> - Hashed password
   */
  static async hashPassword(password: string): Promise<string> {
    try {
      const salt = await bcrypt.genSalt(this.SALT_ROUNDS);
      return await bcrypt.hash(password, salt);
    } catch (error) {
      throw new Error('Failed to hash password');
    }
  }

  /**
   * Compare a plain text password with a hashed password
   * @param password - Plain text password
   * @param hashedPassword - Hashed password to compare against
   * @returns Promise<boolean> - True if passwords match, false otherwise
   */
  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      throw new Error('Failed to compare passwords');
    }
  }

  /**
   * Generate a secure random token for email verification or password reset
   * @param length - Length of the token (default: 32)
   * @returns string - Secure random token
   */
  static generateSecureToken(length: number = this.TOKEN_LENGTH): string {
    try {
      return crypto.randomBytes(length).toString('hex');
    } catch (error) {
      throw new Error('Failed to generate secure token');
    }
  }

  /**
   * Generate a cryptographically secure random string
   * @param length - Length of the random string
   * @returns string - Random string
   */
  static generateRandomString(length: number): string {
    try {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      const randomBytes = crypto.randomBytes(length);
      
      for (let i = 0; i < length; i++) {
        result += chars[randomBytes[i] % chars.length];
      }
      
      return result;
    } catch (error) {
      throw new Error('Failed to generate random string');
    }
  }

  /**
   * Generate a secure session ID
   * @returns string - Secure session ID
   */
  static generateSessionId(): string {
    try {
      return crypto.randomUUID();
    } catch (error) {
      throw new Error('Failed to generate session ID');
    }
  }

  /**
   * Create a hash of a string using SHA-256
   * @param data - String to hash
   * @returns string - SHA-256 hash
   */
  static createHash(data: string): string {
    try {
      return crypto.createHash('sha256').update(data).digest('hex');
    } catch (error) {
      throw new Error('Failed to create hash');
    }
  }

  /**
   * Generate a time-based one-time password (TOTP) token
   * @param secret - Secret key for TOTP generation
   * @param timeStep - Time step in seconds (default: 30)
   * @returns string - TOTP token
   */
  static generateTOTP(secret: string, timeStep: number = 30): string {
    try {
      const time = Math.floor(Date.now() / 1000 / timeStep);
      const timeBuffer = Buffer.alloc(8);
      timeBuffer.writeUInt32BE(time, 4);
      
      const hmac = crypto.createHmac('sha1', secret);
      hmac.update(timeBuffer);
      const hash = hmac.digest();
      
      const offset = hash[hash.length - 1] & 0xf;
      const code = ((hash[offset] & 0x7f) << 24) |
                   ((hash[offset + 1] & 0xff) << 16) |
                   ((hash[offset + 2] & 0xff) << 8) |
                   (hash[offset + 3] & 0xff);
      
      return (code % 1000000).toString().padStart(6, '0');
    } catch (error) {
      throw new Error('Failed to generate TOTP');
    }
  }

  /**
   * Validate password strength
   * @param password - Password to validate
   * @returns object - Validation result with score and feedback
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('Password must be at least 8 characters long');
    }

    if (password.length >= 12) {
      score += 1;
    }

    // Character variety checks
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain at least one lowercase letter');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain at least one uppercase letter');
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain at least one number');
    }

    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain at least one special character');
    }

    // Common patterns check
    if (!/(.)\1{2,}/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password should not contain repeated characters');
    }

    const isValid = score >= 5 && feedback.length === 0;

    return {
      isValid,
      score,
      feedback
    };
  }

  /**
   * Generate a secure API key
   * @param prefix - Optional prefix for the API key
   * @returns string - Secure API key
   */
  static generateApiKey(prefix?: string): string {
    try {
      const randomPart = this.generateSecureToken(24);
      return prefix ? `${prefix}_${randomPart}` : randomPart;
    } catch (error) {
      throw new Error('Failed to generate API key');
    }
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   * @param a - First string
   * @param b - Second string
   * @returns boolean - True if strings are equal
   */
  static constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }
}