/**
 * VYRO Creative Studio - Enterprise Owner Security Service
 * Handles server-side Owner Session acquisition, cryptographically verified
 * authorization headers, and server-authorized Owner Action dispatches.
 */

const OWNER_TOKEN_STORAGE_KEY = 'ai_creative_studio_owner_token_v1';

export class OwnerSecurityService {
  private static inMemoryOwnerToken: string | null = null;

  public static getOwnerToken(): string | null {
    if (this.inMemoryOwnerToken) return this.inMemoryOwnerToken;
    try {
      if (typeof sessionStorage !== 'undefined') {
        const stored = sessionStorage.getItem(OWNER_TOKEN_STORAGE_KEY);
        if (stored) {
          this.inMemoryOwnerToken = stored;
          return stored;
        }
      }
    } catch {
      // Ignore storage access errors
    }
    return null;
  }

  public static setOwnerToken(token: string | null): void {
    this.inMemoryOwnerToken = token;
    try {
      if (typeof sessionStorage !== 'undefined') {
        if (token) {
          sessionStorage.setItem(OWNER_TOKEN_STORAGE_KEY, token);
        } else {
          sessionStorage.removeItem(OWNER_TOKEN_STORAGE_KEY);
        }
      }
    } catch {
      // Ignore storage access errors
    }
  }

  public static getAuthHeaders(): Record<string, string> {
    const token = this.getOwnerToken();
    if (token) {
      return {
        'Authorization': `Bearer ${token}`,
        'x-owner-token': token,
      };
    }
    return {};
  }

  /**
   * Request a cryptographically signed Owner Session from the server
   */
  public static async acquireOwnerSession(user: { id: string; email: string; role?: string }): Promise<{
    success: boolean;
    token?: string;
    error?: string;
  }> {
    if (!user || user.role !== 'owner') {
      this.setOwnerToken(null);
      return { success: false, error: 'User is not an owner' };
    }

    try {
      const res = await fetch('/api/auth/owner-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.token) {
        this.setOwnerToken(data.token);
        return { success: true, token: data.token };
      } else {
        this.setOwnerToken(null);
        return { success: false, error: data.error || 'Server denied owner session authorization.' };
      }
    } catch (err: any) {
      this.setOwnerToken(null);
      return { success: false, error: err.message || 'Failed to contact server for owner authentication.' };
    }
  }

  /**
   * Dispatches an owner administrative action to the server for verification and audit logging
   */
  public static async authorizeOwnerAction(
    action: string,
    payload: Record<string, any>
  ): Promise<{ authorized: boolean; error?: string }> {
    const token = this.getOwnerToken();
    if (!token) {
      return { authorized: false, error: 'No active server owner session token.' };
    }

    try {
      const res = await fetch('/api/owner/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify({
          action,
          ...payload,
        }),
      });

      const data = await res.json();
      if (res.ok && data.authorized) {
        return { authorized: true };
      }
      return { authorized: false, error: data.error || 'Action rejected by server-side owner authorization policy.' };
    } catch (err: any) {
      return { authorized: false, error: err.message || 'Server communication error during action authorization.' };
    }
  }
}
