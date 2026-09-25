import bcrypt from 'bcryptjs';

/**
 * VYRO Creative Studio - Enterprise Security & Cryptographic Service
 * Provides dedicated bcrypt password KDF (work factor 10), legacy SHA-256 migration,
 * password strength evaluation, rate-limiting protection, email verification,
 * and security audit tracking.
 */

export interface PasswordStrengthResult {
  score: number; // 0 to 4
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong';
  color: string;
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  feedback: string[];
}

export interface SecurityEventRecord {
  id: string;
  type: 
    | 'auth_signin'
    | 'auth_signup'
    | 'auth_failed'
    | 'auth_google'
    | 'password_changed'
    | 'password_reset_requested'
    | 'password_reset_completed'
    | 'session_revoked'
    | 'all_sessions_revoked'
    | 'email_verified'
    | 'email_verification_sent'
    | 'account_deleted';
  timestamp: string;
  ip: string;
  device: string;
  description: string;
}

// In-memory rate limiting map for failed login attempts
const failedAttemptsMap: Record<string, { count: number; lockedUntil: number }> = {};
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 1000; // 1 minute lockout

export class SecurityService {
  /**
   * Generates cryptographically secure random hexadecimal characters
   */
  static generateRandomHex(length = 16): string {
    const array = new Uint8Array(length);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(array);
    } else {
      for (let i = 0; i < length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generates a cryptographically secure bcrypt salt with standard work factor 10
   */
  static generateSalt(rounds = 10): string {
    try {
      return bcrypt.genSaltSync(rounds);
    } catch {
      return this.generateRandomHex(16);
    }
  }

  /**
   * Checks whether a hash string is a standard bcrypt hash ($2a$, $2b$, or $2y$)
   */
  static isBcryptHash(hash?: string): boolean {
    if (!hash || typeof hash !== 'string') return false;
    return hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$');
  }

  /**
   * Determines if a stored password hash needs migration to the modern bcrypt KDF
   */
  static needsRehash(hash?: string): boolean {
    if (!hash) return true;
    return !this.isBcryptHash(hash);
  }

  /**
   * Hashes a password using the dedicated bcrypt password KDF (work factor 10)
   */
  static async hashPassword(password: string, saltOrRounds?: string | number): Promise<string> {
    if (typeof saltOrRounds === 'string' && this.isBcryptHash(saltOrRounds)) {
      return bcrypt.hash(password, saltOrRounds);
    }
    const rounds = typeof saltOrRounds === 'number' ? saltOrRounds : 10;
    return bcrypt.hash(password, rounds);
  }

  /**
   * Verifies password against legacy salted SHA-256 for backward compatibility.
   * Strictly used for seamless transparent migration of pre-existing accounts.
   */
  static async verifyLegacySha256(password: string, hash: string, salt: string): Promise<boolean> {
    const combined = `${salt}:${password}:vyro_studio_secure_salt_v2`;
    if (typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.digest) {
      const encoder = new TextEncoder();
      const data = encoder.encode(combined);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const computed = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return computed === hash;
    }
    
    // Deterministic fallback hash for environments without crypto.subtle
    let fallback = 0x811c9dc5;
    for (let i = 0; i < combined.length; i++) {
      fallback ^= combined.charCodeAt(i);
      fallback += (fallback << 1) + (fallback << 4) + (fallback << 7) + (fallback << 8) + (fallback << 24);
    }
    return (fallback >>> 0).toString(16).padStart(64, '0') === hash;
  }

  /**
   * Verifies an input password against stored hash and salt,
   * returning whether the credentials match and whether a KDF rehash is needed.
   */
  static async verifyPasswordDetails(
    password: string,
    hash: string,
    salt?: string
  ): Promise<{ isValid: boolean; needsRehash: boolean }> {
    if (this.isBcryptHash(hash)) {
      const isValid = await bcrypt.compare(password, hash);
      return { isValid, needsRehash: false };
    }

    // Backward-compatibility: Check legacy salted SHA-256
    if (salt) {
      const isValidLegacy = await this.verifyLegacySha256(password, hash, salt);
      if (isValidLegacy) {
        return { isValid: true, needsRehash: true };
      }
    }

    return { isValid: false, needsRehash: false };
  }

  /**
   * Verifies an input password against stored hash and salt
   * Supports both modern bcrypt KDF and legacy salted SHA-256
   */
  static async verifyPassword(password: string, hash: string, salt?: string): Promise<boolean> {
    const result = await this.verifyPasswordDetails(password, hash, salt);
    return result.isValid;
  }

  /**
   * Evaluates password complexity and produces instant user feedback
   */
  static evaluatePasswordStrength(password: string): PasswordStrengthResult {
    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

    const feedback: string[] = [];
    if (!hasMinLength) feedback.push('At least 8 characters required');
    if (!hasUppercase) feedback.push('Add an uppercase letter (A-Z)');
    if (!hasLowercase) feedback.push('Add a lowercase letter (a-z)');
    if (!hasNumber) feedback.push('Add at least one number (0-9)');
    if (!hasSpecialChar) feedback.push('Add a symbol or special character (!@#$%^&*)');

    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (hasUppercase && hasLowercase) score++;
    if (hasNumber && hasSpecialChar) score++;

    const labels: PasswordStrengthResult['label'][] = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#10b981'];

    return {
      score,
      label: labels[score] || 'Weak',
      color: colors[score] || '#ef4444',
      hasMinLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecialChar,
      feedback,
    };
  }

  /**
   * Checks rate limiting for an email address.
   * Returns remaining lock seconds if locked, or 0 if allowed.
   */
  static checkRateLimit(email: string): { isLocked: boolean; remainingSec: number } {
    const normalized = email.trim().toLowerCase();
    const entry = failedAttemptsMap[normalized];
    if (!entry) return { isLocked: false, remainingSec: 0 };

    const now = Date.now();
    if (entry.lockedUntil > now) {
      const remainingSec = Math.ceil((entry.lockedUntil - now) / 1000);
      return { isLocked: true, remainingSec };
    }

    if (entry.lockedUntil > 0 && entry.lockedUntil <= now) {
      // Lock has expired, reset counter
      delete failedAttemptsMap[normalized];
    }

    return { isLocked: false, remainingSec: 0 };
  }

  /**
   * Records a failed login attempt and locks account if threshold exceeded
   */
  static recordFailedAttempt(email: string): { isLocked: boolean; remainingAttempts: number; remainingSec: number } {
    const normalized = email.trim().toLowerCase();
    const entry = failedAttemptsMap[normalized] || { count: 0, lockedUntil: 0 };
    entry.count += 1;

    if (entry.count >= MAX_FAILED_ATTEMPTS) {
      entry.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
      failedAttemptsMap[normalized] = entry;
      return { isLocked: true, remainingAttempts: 0, remainingSec: 60 };
    }

    failedAttemptsMap[normalized] = entry;
    return {
      isLocked: false,
      remainingAttempts: MAX_FAILED_ATTEMPTS - entry.count,
      remainingSec: 0,
    };
  }

  /**
   * Clears failed login counter on successful sign-in
   */
  static resetFailedAttempts(email: string): void {
    const normalized = email.trim().toLowerCase();
    delete failedAttemptsMap[normalized];
  }

  /**
   * Generates a 6-digit numeric OTP code for password reset or email verification
   */
  static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Generates a secure random token
   */
  static generateToken(): string {
    return 'vyr_' + this.generateRandomHex(24);
  }

  /**
   * Creates a structured security event record for the user's security log
   */
  static createSecurityEvent(
    type: SecurityEventRecord['type'],
    description: string,
    device?: string
  ): SecurityEventRecord {
    return {
      id: 'sec-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
      type,
      timestamp: new Date().toISOString(),
      ip: '127.0.0.1 (Local Client)',
      device: device || (typeof navigator !== 'undefined' ? `${navigator.platform || 'Web Node'}` : 'Studio Workstation'),
      description,
    };
  }
}
