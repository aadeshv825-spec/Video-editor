import { AuditActionType, AuditLogEntry, UserRole } from '../../types';

const AUDIT_STORAGE_KEY = 'ai_creative_studio_audit_log_v1';

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'audit-init-01',
    actorId: 'usr-owner-01',
    actorName: 'Elena Vance (Owner)',
    actorRole: 'owner',
    action: 'pro_granted',
    targetUserId: 'usr-creator-02',
    targetUserName: 'Marcus Cole',
    timestamp: '2026-09-12T14:30:00.000Z',
    details: 'Owner granted 365 days Pro subscription with 5,000 monthly credits',
    previousValue: 'Pro: false',
    newValue: 'Pro: true (Expires 2027-02-01)',
  },
  {
    id: 'audit-init-02',
    actorId: 'usr-owner-01',
    actorName: 'Elena Vance (Owner)',
    actorRole: 'owner',
    action: 'pricing_changed',
    timestamp: '2026-09-15T09:15:00.000Z',
    details: 'Configured competitive Pro pricing matrix (Monthly: ₹249, 3-Mo: ₹649, 6-Mo: ₹1,099, Yearly: ₹1,799)',
    previousValue: 'Default static tier',
    newValue: 'Dynamic INR Tier 1 Matrix',
  },
  {
    id: 'audit-init-03',
    actorId: 'usr-owner-01',
    actorName: 'Elena Vance (Owner)',
    actorRole: 'owner',
    action: 'user_suspended',
    targetUserId: 'usr-suspended-04',
    targetUserName: 'Jordan Reed',
    timestamp: '2026-09-16T17:40:00.000Z',
    details: 'Suspended user account for repeated abuse of transient API endpoints',
    previousValue: 'Status: active',
    newValue: 'Status: suspended',
  },
];

export class AuditLogService {
  public static getLogs(): AuditLogEntry[] {
    try {
      const saved = localStorage.getItem(AUDIT_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse audit logs', e);
    }
    return INITIAL_AUDIT_LOGS;
  }

  public static record(params: {
    actorId: string;
    actorName: string;
    actorRole: UserRole;
    action: AuditActionType;
    targetUserId?: string;
    targetUserName?: string;
    details: string;
    previousValue?: string;
    newValue?: string;
  }): AuditLogEntry {
    const entry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...params,
    };

    try {
      const current = this.getLogs();
      const updated = [entry, ...current].slice(0, 200); // Keep last 200 actions
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('audit-log-updated', { detail: entry }));
    } catch (e) {
      console.warn('Failed to persist audit log entry', e);
    }

    return entry;
  }

  public static clearLogs(): void {
    try {
      localStorage.removeItem(AUDIT_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('audit-log-updated', { detail: null }));
    } catch (e) {
      console.warn('Failed to clear audit logs', e);
    }
  }
}
