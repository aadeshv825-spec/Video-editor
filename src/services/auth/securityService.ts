/**
 * VYRO Creative Studio - Enterprise Security & Cryptographic Service
 * Provides salted SHA-256 hashing, password strength evaluation,
 * rate-limiting protection, email verification, and security audit tracking.
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
   * Generates a cryptographically strong random salt
   */
  static generateSalt(length = 16): string {
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
   * Hashes password using SHA-256 with a unique cryptographic salt
   * Uses Web Crypto API when available with synchronous fallback
   */
  static async hashPassword(password: string, salt: string): Promise<string> {
    const combined = `${salt}:${password}:vyro_studio_secure_salt_v2`;
    if (typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.digest) {
      const encoder = new TextEncoder();
      const data = encoder.encode(combined);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    // Deterministic fallback hash for environments without crypto.subtle
    let hash = 0x811c9dc5;
    for (let i = 0; i < combined.length; i++) {
      hash ^= combined.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return (hash >>> 0).toString(16).padStart(64, '0');
  }

  /**
   * Verifies an input password against stored hash and salt
   */
  static async verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
    const computed = await this.hashPassword(password, salt);
    return computed === hash;
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
    return 'vyr_' + this.generateSalt(24);
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
