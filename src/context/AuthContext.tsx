import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_USERS } from '../data/initialData';
import { EntitlementKey, ProSource, User, UserRole, UserStatus } from '../types';
import { EntitlementService } from '../services/entitlement/entitlementService';
import { CreditLedgerService } from '../services/credits/creditLedgerService';
import { AuditLogService } from '../services/owner/auditLogService';
import { SecurityService } from '../services/auth/securityService';

interface AuthContextType {
  currentUser: User;
  user: User;
  users: User[];
  isOwner: boolean;
  isAdmin: boolean;
  isPro: boolean;
  deductCredits: (amount: number, reason?: string, jobInfo?: { jobId?: string; model?: string }) => boolean;
  refundCredits: (amount: number, reason?: string, jobInfo?: { jobId?: string; model?: string }) => void;
  canAccessTool: (toolId: string) => boolean;
  canAccessEntitlement: (key: EntitlementKey) => boolean;
  signIn: (email: string, pass?: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: (email?: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (name: string, email: string, pass?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
  signOutOtherDevices: () => void;
  deleteAccount: (userId: string, passwordConfirmation?: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; resetCode?: string; error?: string; message: string }>;
  completePasswordReset: (email: string, code: string, newPassword: string) => Promise<{ success: boolean; error?: string; message: string }>;
  verifyEmail: (code?: string) => Promise<{ success: boolean; error?: string }>;
  resendVerificationEmail: () => Promise<{ success: boolean; verificationCode?: string; message: string }>;
  switchUserPersona: (userId: string) => void;
  updateAccountProfile: (updates: Partial<User>) => void;
  restorePurchase: () => Promise<{ restored: boolean; message: string }>;
  // Owner management controls
  ownerGrantPro: (userId: string, durationDays: number | null, source: ProSource, customExpiryDate?: string) => void;
  ownerRevokePro: (userId: string) => void;
  ownerAdjustCredits: (userId: string, deltaCredits: number, reason?: string) => void;
  ownerSetCredits: (userId: string, targetAmount: number, reason?: string) => void;
  ownerToggleToolPermission: (userId: string, toolId: string) => void;
  ownerSetFeatureOverride: (userId: string, key: EntitlementKey, allowed: boolean | undefined) => void;
  ownerToggleBetaAccess: (userId: string) => void;
  ownerUpdateRole: (userId: string, role: UserRole) => void;
  ownerUpdateStatus: (userId: string, status: UserStatus) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_USERS_KEY = 'ai_creative_studio_users_v1';
const STORAGE_CURRENT_USER_KEY = 'ai_creative_studio_curr_user_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_USERS_KEY);
      if (saved) {
        const parsed: User[] = JSON.parse(saved);
        // Sanitize any legacy 100000 demo credit balances
        return parsed.map(u => {
          if (u.aiCredits === 100000) {
            return { ...u, aiCredits: 5000 };
          }
          return u;
        });
      }
      return INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
      return saved && INITIAL_USERS.some(u => u.id === saved) ? saved : INITIAL_USERS[0].id;
    } catch {
      return INITIAL_USERS[0].id;
    }
  });

  // Reconcile and subscribe to external credit ledger updates
  useEffect(() => {
    const handleLedgerUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ userId: string; balanceAfter: number }>;
      if (customEvent.detail && customEvent.detail.userId) {
        const { userId, balanceAfter } = customEvent.detail;
        setUsers(prev =>
          prev.map(u => (u.id === userId ? { ...u, aiCredits: balanceAfter } : u))
        );
      }
    };

    window.addEventListener('credit-ledger-updated', handleLedgerUpdate);
    return () => {
      window.removeEventListener('credit-ledger-updated', handleLedgerUpdate);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
    } catch (err) {
      console.warn('Failed to save users in localStorage', err);
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CURRENT_USER_KEY, currentUserId);
    } catch (err) {
      console.warn('Failed to save current user id', err);
    }
  }, [currentUserId]);

  const currentUser = users.find(u => u.id === currentUserId) || users[0];

  const isOwner = currentUser.role === 'owner';
  const isAdmin = currentUser.role === 'owner' || currentUser.role === 'admin';

  // Calculate Pro status with entitlement service
  const isPro = EntitlementService.isProActive(currentUser);

  const canAccessTool = (toolId: string): boolean => {
    if (isOwner) return true;
    if (currentUser.enabledPremiumTools?.includes(toolId)) return true;
    if (isPro) return true;
    return false;
  };

  const canAccessEntitlement = (key: EntitlementKey): boolean => {
    return EntitlementService.checkEntitlement(currentUser, key).allowed;
  };

  const switchUserPersona = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (target) {
      setCurrentUserId(userId);
    }
  };

  const signIn = async (email: string, pass?: string): Promise<{ success: boolean; error?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();
    
    // Check rate-limiting
    const rateLimit = SecurityService.checkRateLimit(trimmedEmail);
    if (rateLimit.isLocked) {
      return {
        success: false,
        error: `Account temporarily locked due to excessive failed attempts. Please retry in ${rateLimit.remainingSec}s.`,
      };
    }

    const found = users.find(u => u.email.toLowerCase() === trimmedEmail);
    if (!found) {
      SecurityService.recordFailedAttempt(trimmedEmail);
      return {
        success: false,
        error: 'No registered account found with this email address. Please create an account.',
      };
    }

    if (found.status === 'suspended') {
      return {
        success: false,
        error: 'This studio account has been suspended by system administration. Please contact owner.',
      };
    }

    // Password verification if password exists
    if (found.passwordHash && found.passwordSalt) {
      if (!pass) {
        return { success: false, error: 'Password is required to sign in.' };
      }
      const isValid = await SecurityService.verifyPassword(pass, found.passwordHash, found.passwordSalt);
      if (!isValid) {
        const attempt = SecurityService.recordFailedAttempt(trimmedEmail);
        if (attempt.isLocked) {
          return {
            success: false,
            error: `Too many incorrect attempts. Account locked for ${attempt.remainingSec}s.`,
          };
        }
        return {
          success: false,
          error: `Incorrect password. ${attempt.remainingAttempts} attempt(s) remaining before lockout.`,
        };
      }
    }

    // Clear failed attempts counter upon successful verification
    SecurityService.resetFailedAttempts(trimmedEmail);

    // Update active device and security event log
    const secEvent = SecurityService.createSecurityEvent('auth_signin', 'Signed in successfully via email/password');
    setUsers(prev =>
      prev.map(u => {
        if (u.id === found.id) {
          return {
            ...u,
            lastActiveAt: 'Just now',
            securityEvents: [secEvent, ...(u.securityEvents || [])].slice(0, 30),
          };
        }
        return u;
      })
    );

    setCurrentUserId(found.id);
    return { success: true };
  };

  const signInWithGoogle = async (email?: string, name?: string): Promise<{ success: boolean; error?: string }> => {
    const googleEmail = email?.trim().toLowerCase() || 'aadeshv825@gmail.com';
    const googleName = name?.trim() || 'Aadesh V';
    const existing = users.find(u => u.email.toLowerCase() === googleEmail);

    const secEvent = SecurityService.createSecurityEvent('auth_google', 'Authenticated securely via Google Identity Services');

    if (existing) {
      setUsers(prev =>
        prev.map(u => {
          if (u.id === existing.id) {
            return {
              ...u,
              emailVerified: true,
              lastActiveAt: 'Just now',
              securityEvents: [secEvent, ...(u.securityEvents || [])].slice(0, 30),
            };
          }
          return u;
        })
      );
      setCurrentUserId(existing.id);
      return { success: true };
    }

    const newUser: User = {
      id: `usr-g-${Date.now()}`,
      name: googleName,
      email: googleEmail,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      role: 'user',
      status: 'active',
      isPro: false,
      aiCredits: 300,
      enabledPremiumTools: [],
      betaAccess: false,
      authProvider: 'google',
      emailVerified: true,
      devices: [
        {
          id: `dev-${Date.now()}`,
          name: 'Primary Session (Google Account)',
          platform: 'web',
          browser: 'Chrome 128',
          lastActiveAt: 'Active Now',
          isCurrent: true,
        },
      ],
      createdAt: new Date().toISOString(),
      lastActiveAt: 'Just now',
      securityEvents: [secEvent],
    };

    setUsers(prev => [newUser, ...prev]);
    setCurrentUserId(newUser.id);
    return { success: true };
  };

  const signUp = async (name: string, email: string, pass?: string): Promise<{ success: boolean; error?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();
    const existing = users.find(u => u.email.toLowerCase() === trimmedEmail);
    if (existing) {
      return {
        success: false,
        error: 'An account with this email address already exists. Please sign in.',
      };
    }

    if (pass) {
      const strength = SecurityService.evaluatePasswordStrength(pass);
      if (!strength.hasMinLength) {
        return {
          success: false,
          error: 'Password must be at least 8 characters long.',
        };
      }
    }

    const salt = SecurityService.generateSalt();
    const hash = pass ? await SecurityService.hashPassword(pass, salt) : undefined;
    const secEvent = SecurityService.createSecurityEvent('auth_signup', 'New studio creator account registered');

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: name.trim() || 'New Creator',
      email: trimmedEmail,
      role: 'user',
      status: 'active',
      isPro: false,
      aiCredits: 300,
      enabledPremiumTools: [],
      betaAccess: false,
      authProvider: 'email',
      passwordSalt: salt,
      passwordHash: hash,
      emailVerified: false,
      emailVerificationToken: SecurityService.generateToken(),
      devices: [
        {
          id: `dev-${Date.now()}`,
          name: 'Primary Device Session',
          platform: 'web',
          lastActiveAt: 'Active Now',
          isCurrent: true,
        },
      ],
      createdAt: new Date().toISOString(),
      lastActiveAt: 'Just now',
      securityEvents: [secEvent],
    };

    setUsers(prev => [newUser, ...prev]);
    setCurrentUserId(newUser.id);

    CreditLedgerService.recordTransaction({
      userId: newUser.id,
      type: 'trial_grant',
      reason: 'Welcome bonus on new Studio account signup',
      creditsAdded: 300,
      creditsConsumed: 0,
      currentBalance: 0,
    });

    return { success: true };
  };

  const signOut = () => {
    const guest = users.find(u => u.role === 'user') || users[0];
    setCurrentUserId(guest.id);
  };

  const signOutOtherDevices = () => {
    const secEvent = SecurityService.createSecurityEvent('all_sessions_revoked', 'Revoked all other active remote sessions');
    setUsers(prev =>
      prev.map(u => {
        if (u.id === currentUserId) {
          const remainingDevices = (u.devices || []).filter(d => d.isCurrent);
          return {
            ...u,
            devices: remainingDevices.length > 0 ? remainingDevices : [
              {
                id: 'dev-current',
                name: 'Current Browser Session',
                platform: 'web',
                lastActiveAt: 'Active Now',
                isCurrent: true,
              },
            ],
            securityEvents: [secEvent, ...(u.securityEvents || [])].slice(0, 30),
          };
        }
        return u;
      })
    );
  };

  const deleteAccount = async (userId: string, _passwordConfirmation?: string): Promise<{ success: boolean; error?: string }> => {
    if (userId === currentUser.id && isOwner) {
      return {
        success: false,
        error: 'Platform owner root account cannot be deleted for operational integrity.',
      };
    }

    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) {
      return { success: false, error: 'User account not found.' };
    }

    setUsers(prev => prev.filter(u => u.id !== userId));

    if (currentUserId === userId) {
      const fallback = users.find(u => u.id !== userId) || INITIAL_USERS[0];
      setCurrentUserId(fallback.id);
    }

    AuditLogService.record({
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: 'account_deleted',
      targetUserId: userId,
      targetUserName: targetUser.name || 'Deleted Account',
      details: `User account deleted permanently. Associated cache and sessions purged.`,
    });

    return { success: true };
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    const user = users.find(u => u.id === currentUserId);
    if (!user) return { success: false, error: 'User not found.' };

    // If existing password exists, verify current
    if (user.passwordHash && user.passwordSalt) {
      const isCurrentValid = await SecurityService.verifyPassword(currentPassword, user.passwordHash, user.passwordSalt);
      if (!isCurrentValid) {
        return { success: false, error: 'Current password does not match existing records.' };
      }
    }

    const strength = SecurityService.evaluatePasswordStrength(newPassword);
    if (!strength.hasMinLength) {
      return { success: false, error: 'New password must contain at least 8 characters.' };
    }

    const newSalt = SecurityService.generateSalt();
    const newHash = await SecurityService.hashPassword(newPassword, newSalt);
    const secEvent = SecurityService.createSecurityEvent('password_changed', 'Account password updated successfully');

    setUsers(prev =>
      prev.map(u => {
        if (u.id === currentUserId) {
          return {
            ...u,
            passwordHash: newHash,
            passwordSalt: newSalt,
            securityEvents: [secEvent, ...(u.securityEvents || [])].slice(0, 30),
          };
        }
        return u;
      })
    );

    return { success: true };
  };

  const requestPasswordReset = async (email: string): Promise<{ success: boolean; resetCode?: string; error?: string; message: string }> => {
    const trimmed = email.trim().toLowerCase();
    const user = users.find(u => u.email.toLowerCase() === trimmed);
    if (!user) {
      return {
        success: false,
        error: 'No account registered with this email address.',
        message: 'Email not found.',
      };
    }

    const resetOtp = SecurityService.generateOTP();
    const resetExpires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const secEvent = SecurityService.createSecurityEvent('password_reset_requested', `Password reset code sent to ${trimmed}`);

    setUsers(prev =>
      prev.map(u => {
        if (u.id === user.id) {
          return {
            ...u,
            resetToken: resetOtp,
            resetTokenExpiresAt: resetExpires,
            securityEvents: [secEvent, ...(u.securityEvents || [])].slice(0, 30),
          };
        }
        return u;
      })
    );

    return {
      success: true,
      resetCode: resetOtp,
      message: `A 6-digit password reset code has been generated and dispatched to ${trimmed}.`,
    };
  };

  const completePasswordReset = async (
    email: string,
    code: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string; message: string }> => {
    const trimmed = email.trim().toLowerCase();
    const user = users.find(u => u.email.toLowerCase() === trimmed);
    if (!user) {
      return { success: false, error: 'User not found.', message: 'Account not found.' };
    }

    if (!user.resetToken || user.resetToken !== code.trim()) {
      return { success: false, error: 'Invalid or expired 6-digit verification code.', message: 'Verification failed.' };
    }

    if (user.resetTokenExpiresAt && new Date(user.resetTokenExpiresAt).getTime() < Date.now()) {
      return { success: false, error: 'Password reset code has expired. Please request a new one.', message: 'Code expired.' };
    }

    const strength = SecurityService.evaluatePasswordStrength(newPassword);
    if (!strength.hasMinLength) {
      return { success: false, error: 'Password must be at least 8 characters long.', message: 'Password too weak.' };
    }

    const salt = SecurityService.generateSalt();
    const hash = await SecurityService.hashPassword(newPassword, salt);
    const secEvent = SecurityService.createSecurityEvent('password_reset_completed', 'Password reset completed via verified code');

    setUsers(prev =>
      prev.map(u => {
        if (u.id === user.id) {
          return {
            ...u,
            passwordHash: hash,
            passwordSalt: salt,
            resetToken: undefined,
            resetTokenExpiresAt: undefined,
            securityEvents: [secEvent, ...(u.securityEvents || [])].slice(0, 30),
          };
        }
        return u;
      })
    );

    return { success: true, message: 'Password reset successfully! You may now sign in.' };
  };

  const verifyEmail = async (code?: string): Promise<{ success: boolean; error?: string }> => {
    const secEvent = SecurityService.createSecurityEvent('email_verified', 'Email address verified successfully');
    setUsers(prev =>
      prev.map(u => {
        if (u.id === currentUserId) {
          return {
            ...u,
            emailVerified: true,
            emailVerificationToken: undefined,
            securityEvents: [secEvent, ...(u.securityEvents || [])].slice(0, 30),
          };
        }
        return u;
      })
    );
    return { success: true };
  };

  const resendVerificationEmail = async (): Promise<{ success: boolean; verificationCode?: string; message: string }> => {
    const code = SecurityService.generateOTP();
    const secEvent = SecurityService.createSecurityEvent('email_verification_sent', `Verification code sent to ${currentUser.email}`);
    setUsers(prev =>
      prev.map(u => {
        if (u.id === currentUserId) {
          return {
            ...u,
            emailVerificationToken: code,
            securityEvents: [secEvent, ...(u.securityEvents || [])].slice(0, 30),
          };
        }
        return u;
      })
    );
    return {
      success: true,
      verificationCode: code,
      message: `Verification code (${code}) sent to ${currentUser.email}.`,
    };
  };

  const updateAccountProfile = (updates: Partial<User>) => {
    setUsers(prev =>
      prev.map(u => (u.id === currentUserId ? { ...u, ...updates } : u))
    );
  };

  const restorePurchase = async (): Promise<{ restored: boolean; message: string }> => {
    await new Promise(r => setTimeout(r, 800));
    if (currentUser.isPro) {
      return {
        restored: true,
        message: `Active subscription verified (${currentUser.proSource || 'Pro Plan'}). Entitlements refreshed.`,
      };
    }
    return {
      restored: false,
      message: 'No previous purchases found for this email account on the active billing gateway.',
    };
  };

  // Owner methods
  const ownerGrantPro = (
    userId: string,
    durationDays: number | null,
    source: ProSource,
    customExpiryDate?: string
  ) => {
    if (!isOwner) return;

    let expiresAt: string | null = null;
    if (customExpiryDate) {
      expiresAt = new Date(customExpiryDate).toISOString();
    } else if (durationDays !== null) {
      expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
    }

    const targetUser = users.find(u => u.id === userId);

    setUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          return {
            ...u,
            isPro: true,
            proSource: source,
            proExpiresAt: expiresAt,
          };
        }
        return u;
      })
    );

    AuditLogService.record({
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: 'pro_granted',
      targetUserId: userId,
      targetUserName: targetUser?.name,
      details: `Granted Pro access (${durationDays ? `${durationDays} days` : customExpiryDate ? `Until ${customExpiryDate}` : 'Lifetime'})`,
      previousValue: targetUser ? `isPro: ${targetUser.isPro}` : '',
      newValue: `isPro: true, expires: ${expiresAt || 'Lifetime'}`,
    });
  };

  const ownerRevokePro = (userId: string) => {
    if (!isOwner) return;
    const targetUser = users.find(u => u.id === userId);

    setUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          return {
            ...u,
            isPro: false,
            proSource: undefined,
            proExpiresAt: undefined,
          };
        }
        return u;
      })
    );

    AuditLogService.record({
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: 'pro_revoked',
      targetUserId: userId,
      targetUserName: targetUser?.name,
      details: `Revoked Pro access`,
      previousValue: 'Pro: Active',
      newValue: 'Pro: Inactive',
    });
  };

  const ownerAdjustCredits = (userId: string, deltaCredits: number, reason?: string) => {
    if (!isOwner) return;
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    const newCredits = Math.max(0, targetUser.aiCredits + deltaCredits);

    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, aiCredits: newCredits } : u))
    );

    CreditLedgerService.recordTransaction({
      userId,
      type: deltaCredits >= 0 ? 'owner_grant' : 'owner_deduction',
      reason: reason || (deltaCredits >= 0 ? 'Owner credit grant' : 'Owner credit deduction'),
      creditsAdded: deltaCredits >= 0 ? deltaCredits : 0,
      creditsConsumed: deltaCredits < 0 ? Math.abs(deltaCredits) : 0,
      currentBalance: targetUser.aiCredits,
    });

    AuditLogService.record({
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: deltaCredits >= 0 ? 'credits_added' : 'credits_removed',
      targetUserId: userId,
      targetUserName: targetUser.name,
      details: `${deltaCredits >= 0 ? '+' : ''}${deltaCredits} credits (${reason || 'Owner grant'})`,
      previousValue: `${targetUser.aiCredits} CR`,
      newValue: `${newCredits} CR`,
    });
  };

  const ownerSetCredits = (userId: string, targetAmount: number, reason?: string) => {
    if (!isOwner) return;
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    const diff = targetAmount - targetUser.aiCredits;
    ownerAdjustCredits(userId, diff, reason || `Owner set credit balance to ${targetAmount}`);
  };

  const ownerToggleToolPermission = (userId: string, toolId: string) => {
    if (!isOwner) return;
    setUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          const currentTools = u.enabledPremiumTools || [];
          const exists = currentTools.includes(toolId);
          return {
            ...u,
            enabledPremiumTools: exists
              ? currentTools.filter(t => t !== toolId)
              : [...currentTools, toolId],
          };
        }
        return u;
      })
    );
  };

  const ownerSetFeatureOverride = (userId: string, key: EntitlementKey, allowed: boolean | undefined) => {
    if (!isOwner) return;
    const targetUser = users.find(u => u.id === userId);

    setUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          const nextOverrides = { ...(u.featureOverrides || {}) };
          if (allowed === undefined) {
            delete nextOverrides[key];
          } else {
            nextOverrides[key] = allowed;
          }
          return {
            ...u,
            featureOverrides: nextOverrides,
          };
        }
        return u;
      })
    );

    AuditLogService.record({
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: 'feature_permission_changed',
      targetUserId: userId,
      targetUserName: targetUser?.name,
      details: `Feature override '${key}' set to ${allowed === undefined ? 'default' : allowed ? 'ALLOWED' : 'BLOCKED'}`,
    });
  };

  const ownerToggleBetaAccess = (userId: string) => {
    if (!isOwner) return;
    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, betaAccess: !u.betaAccess } : u))
    );
  };

  const ownerUpdateRole = (userId: string, role: UserRole) => {
    if (!isOwner) return;
    const targetUser = users.find(u => u.id === userId);

    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, role } : u))
    );

    AuditLogService.record({
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: 'feature_permission_changed',
      targetUserId: userId,
      targetUserName: targetUser?.name,
      details: `Role updated from ${targetUser?.role} to ${role}`,
    });
  };

  const ownerUpdateStatus = (userId: string, status: UserStatus) => {
    if (!isOwner) return;
    const targetUser = users.find(u => u.id === userId);

    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, status } : u))
    );

    AuditLogService.record({
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: status === 'suspended' ? 'user_suspended' : 'user_restored',
      targetUserId: userId,
      targetUserName: targetUser?.name,
      details: `User status changed to ${status}`,
    });
  };

  const deductCredits = (
    amount: number,
    reason?: string,
    jobInfo?: { jobId?: string; model?: string }
  ): boolean => {
    if (currentUser.aiCredits < amount) return false;
    const newBal = currentUser.aiCredits - amount;

    setUsers(prev =>
      prev.map(u => (u.id === currentUserId ? { ...u, aiCredits: Math.max(0, u.aiCredits - amount) } : u))
    );

    CreditLedgerService.recordTransaction({
      userId: currentUser.id,
      type: 'ai_usage',
      reason: reason || 'AI inference operation',
      creditsAdded: 0,
      creditsConsumed: amount,
      relatedJobId: jobInfo?.jobId,
      modelOrProvider: jobInfo?.model,
      currentBalance: currentUser.aiCredits,
    });

    return true;
  };

  const refundCredits = (
    amount: number,
    reason?: string,
    jobInfo?: { jobId?: string; model?: string }
  ) => {
    if (amount <= 0) return;

    setUsers(prev =>
      prev.map(u => (u.id === currentUserId ? { ...u, aiCredits: u.aiCredits + amount } : u))
    );

    CreditLedgerService.recordTransaction({
      userId: currentUser.id,
      type: 'refund_failed_job',
      reason: reason || 'Refund for failed or cancelled AI operation',
      creditsAdded: amount,
      creditsConsumed: 0,
      relatedJobId: jobInfo?.jobId,
      modelOrProvider: jobInfo?.model,
      currentBalance: currentUser.aiCredits,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        user: currentUser,
        users,
        isOwner,
        isAdmin,
        isPro,
        deductCredits,
        refundCredits,
        canAccessTool,
        canAccessEntitlement,
        signIn,
        signInWithGoogle,
        signUp,
        signOut,
        signOutOtherDevices,
        deleteAccount,
        changePassword,
        requestPasswordReset,
        completePasswordReset,
        verifyEmail,
        resendVerificationEmail,
        switchUserPersona,
        updateAccountProfile,
        restorePurchase,
        ownerGrantPro,
        ownerRevokePro,
        ownerAdjustCredits,
        ownerSetCredits,
        ownerToggleToolPermission,
        ownerSetFeatureOverride,
        ownerToggleBetaAccess,
        ownerUpdateRole,
        ownerUpdateStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
