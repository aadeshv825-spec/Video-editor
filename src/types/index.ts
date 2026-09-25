export type UserRole = 'owner' | 'admin' | 'creator' | 'user';

export type UserStatus = 'active' | 'suspended';

export type ProSource = 'subscription' | 'owner_grant' | 'trial';

export interface ConnectedDevice {
  id: string;
  name: string;
  platform: 'web' | 'macos' | 'windows' | 'ios' | 'android' | 'linux';
  browser?: string;
  ipLocation?: string;
  lastActiveAt: string;
  isCurrent: boolean;
}

export type EntitlementKey =
  | 'advanced_video_editing'
  | 'advanced_photo_tools'
  | 'advanced_audio'
  | 'ai_director'
  | 'ai_generation'
  | 'ai_quality_checker'
  | 'semantic_search'
  | 'premium_models'
  | 'advanced_export'
  | 'cloud_features'
  | 'ai_credits';

export type FeatureTier = 'free' | 'trial' | 'pro' | 'owner';

export type FeatureEntitlementMap = Record<EntitlementKey, FeatureTier>;

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  isPro: boolean;
  proSource?: ProSource;
  proExpiresAt?: string | null; // ISO string, or null for indefinite/lifetime
  aiCredits: number;
  enabledPremiumTools: string[]; // List of specific tool IDs unlocked for this user
  featureOverrides?: Partial<Record<EntitlementKey, boolean>>; // Per-user overrides by owner
  betaAccess: boolean;
  devices?: ConnectedDevice[];
  createdAt: string;
  lastActiveAt: string;
  // Security & Authentication fields
  authProvider?: 'google' | 'email' | 'guest';
  passwordHash?: string;
  passwordSalt?: string;
  emailVerified?: boolean;
  emailVerificationToken?: string;
  resetToken?: string;
  resetTokenExpiresAt?: string;
  securityEvents?: Array<{
    id: string;
    type: string;
    timestamp: string;
    ip: string;
    device: string;
    description: string;
  }>;
}

export type StudioType = 'director' | 'video' | 'photo' | 'audio' | 'tools' | 'generate' | 'templates';

export interface MediaAsset {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'image';
  sizeBytes: number;
  durationSec?: number;
  dimensions?: string;
  url: string;
  createdAt: string;
}

export interface EditAction {
  id: string;
  timestamp: string;
  actionType: string;
  description: string;
  reversible: boolean;
  payload?: any;
}

export interface ProjectVersion {
  id: string;
  versionNumber: number;
  title: string;
  createdAt: string;
  notes: string;
  actionCount: number;
  previewUrl?: string;
}

export type SyncStatus =
  | 'synced'
  | 'syncing'
  | 'pending'
  | 'offline'
  | 'conflict'
  | 'failed'
  | 'local_only'
  | 'cloud_unavailable';

export interface ProjectConflict {
  projectId: string;
  projectTitle: string;
  localVersion: number;
  localUpdatedAt: string;
  cloudVersion: number;
  cloudUpdatedAt: string;
  deviceOrigin: string;
  suggestedAction?: 'keep_local' | 'keep_remote' | 'create_copy';
}

export interface SyncPushPayload {
  projectId: string;
  ownerId: string;
  baseVersion: number;
  updatedAt: string;
  deviceId: string;
  revisionId: string;
  projectData: Partial<Project>;
}

export interface SyncPushResult {
  success: boolean;
  status: SyncStatus;
  projectVersion?: number;
  revisionId?: string;
  cloudSyncedAt?: string;
  conflict?: ProjectConflict;
  message?: string;
}

export interface SyncPullResult {
  success: boolean;
  projects: Project[];
  serverTimestamp: string;
  cloudDatabaseStatus: 'READY' | 'SETUP_REQUIRED';
}

export interface MediaUploadTokenRequest {
  projectId?: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
}

export interface MediaUploadTokenResponse {
  success: boolean;
  assetId: string;
  uploadUrl: string;
  storageProvider: 'gcs' | 's3' | 'local';
  isDirectCloudUpload: boolean;
  setupRequired?: boolean;
  maxChunkSizeBytes: number;
  expiresAt: string;
}

export interface Project {
  id: string;
  ownerId?: string; // Account ownership
  title: string;
  type: StudioType;
  createdAt: string;
  updatedAt: string;
  autosavedAt: string;
  cloudSyncedAt?: string;
  syncStatus?: SyncStatus;
  cloudVersion?: number;
  aspectRatio: '16:9' | '9:16' | '1:1' | '21:9' | '4:5' | '4:3';
  resolution: '720p' | '1080p' | '4K';
  fps: number;
  mediaAssets: MediaAsset[];
  versions: ProjectVersion[];
  nonDestructiveHistory: EditAction[];
  historyIndex: number;
  hasRecoverySnapshot: boolean;
  recoverySnapshotTimestamp?: string;
  stateData?: Record<string, any>;
  exportSettings?: Record<string, any>;
}

export type CreditTransactionType =
  | 'trial_grant'
  | 'pro_inclusion'
  | 'owner_grant'
  | 'owner_deduction'
  | 'credit_pack_purchase'
  | 'ai_usage'
  | 'refund_failed_job';

export interface CreditTransaction {
  id: string;
  userId: string;
  type: CreditTransactionType;
  reason: string;
  creditsAdded: number;
  creditsConsumed: number;
  timestamp: string;
  relatedJobId?: string;
  modelOrProvider?: string;
  balanceAfter: number;
}

export type ProPlanId = 'monthly' | 'three_months' | 'six_months' | 'yearly';

export interface ProPlanItem {
  id: ProPlanId;
  name: string;
  periodMonths: number;
  price: number; // Configurable: 249, 649, 1099, 1799
  currency: string;
  savingsLabel?: string;
  includedCredits: number;
  isPopular?: boolean;
}

export interface PricingConfiguration {
  currency: string;
  currencySymbol: string;
  trialDurationDays: number;
  trialCredits: number;
  plans: {
    monthly: ProPlanItem;
    three_months: ProPlanItem;
    six_months: ProPlanItem;
    yearly: ProPlanItem;
  };
  proIncludedFeatures: string[];
  updatedAt: string;
}

export type PaymentGateway = 'not_configured' | 'razorpay' | 'stripe' | 'google_play' | 'app_store';

export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired';

export interface UserSubscription {
  id: string;
  userId: string;
  planId: ProPlanId;
  status: SubscriptionStatus;
  startDate: string; // ISO string
  expiryDate: string; // ISO string
  isTrial: boolean;
  trialEndsAt?: string;
  gateway: PaymentGateway;
  gatewayCustomerId?: string;
  gatewayOrderId?: string;
  gatewaySubscriptionId?: string;
  gatewayPaymentId?: string;
  amount: number;
  currency: string;
  autoRenew: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentOrderCreationResult {
  success: boolean;
  orderId?: string;
  gateway?: PaymentGateway;
  amount?: number;
  currency?: string;
  keyId?: string;
  setupRequired?: boolean;
  message: string;
}

export interface PaymentVerificationPayload {
  userId: string;
  planId: ProPlanId;
  gateway: PaymentGateway;
  orderId?: string;
  paymentId?: string;
  signature?: string;
}

export interface PaymentVerificationResult {
  success: boolean;
  subscription?: UserSubscription;
  proGranted: boolean;
  message: string;
  error?: string;
}

export interface PaymentInitResult {
  supported: boolean;
  gateway: PaymentGateway;
  message: string;
  setupRequired?: boolean;
  orderDetails?: PaymentOrderCreationResult;
}

export interface BackupSettings {
  autoBackupEnabled: boolean;
  wifiOnly: boolean;
  mobileDataAllowed: boolean;
  backupProjects: boolean;
  backupSettings: boolean;
  backupPresets: boolean;
  backupDrafts: boolean;
  backupOriginalMedia: boolean;
  lastBackupTimestamp?: string;
}

export interface CloudStorageUsage {
  totalQuotaBytes: number;
  usedProjectsBytes: number;
  usedBackupsBytes: number;
  usedGeneratedAssetsBytes: number;
  usedTrashBytes: number;
}

export type AuditActionType =
  | 'pro_granted'
  | 'pro_revoked'
  | 'credits_added'
  | 'credits_removed'
  | 'feature_permission_changed'
  | 'user_suspended'
  | 'user_restored'
  | 'global_feature_changed'
  | 'pricing_changed'
  | 'model_config_changed'
  | 'account_deleted';

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: AuditActionType;
  targetUserId?: string;
  targetUserName?: string;
  timestamp: string;
  details: string;
  previousValue?: string;
  newValue?: string;
}

export type ModelCapability =
  | 'video'
  | 'audio'
  | 'image'
  | 'storyboard'
  | 'scripting'
  | 'upscaling'
  | 'vfx';

export type ModelQuality = 'draft' | 'standard' | 'high' | 'ultra';

export type ModelSpeed = 'fast' | 'balanced' | 'quality';

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  capabilities: ModelCapability[];
  quality: ModelQuality;
  speed: ModelSpeed;
  costPerUnit: number; // in credits
  costUnitLabel: string; // e.g. "per sec", "per image", "per generation"
  resolutionMax: string;
  durationLimitSec?: number;
  inputTypes: string[];
  outputTypes: string[];
  availability: 'online' | 'beta' | 'maintenance';
  isProOnly: boolean;
  description: string;
}

export interface ModelRouteQuery {
  capability: ModelCapability;
  inputType?: string;
  preferSpeed?: boolean;
  preferQuality?: boolean;
  maxCostCredits?: number;
  minResolution?: string;
  targetDurationSec?: number;
}

export interface GlobalFeatureFlags {
  directorModule: boolean;
  videoEditorModule: boolean;
  photoStudioModule: boolean;
  audioStudioModule: boolean;
  aiToolsModule: boolean;
  experimentalGenerators: boolean;
  cloudExportEngine: boolean;
  autoSaveCloudSync: boolean;
}

export type ThemeMode = 'system' | 'light' | 'dark';

export interface AppSettings {
  // 1. Appearance
  appearance: {
    theme: ThemeMode;
    uiDensity: 'compact' | 'comfortable';
    reduceAnimations: boolean;
    highContrastBorders: boolean;
  };
  // 2. Privacy & Security
  privacy: {
    telemetryEnabled: boolean;
    zeroDataRetentionMode: boolean;
    excludeFromModelTraining: boolean;
    twoFactorAuthEnabled: boolean;
  };
  // 3. AI
  ai: {
    defaultProvider: 'auto' | 'Google' | 'OpenAI' | 'Runway' | 'Anthropic';
    autoFallbackOnFailure: boolean;
    creativeTemperature: number;
    safetyFilterLevel: 'standard' | 'strict' | 'lenient';
  };
  // 4. Editing
  editing: {
    defaultFps: 24 | 30 | 60;
    timelineSnapping: boolean;
    rippleEditing: boolean;
    autoKeyframeTracking: boolean;
  };
  // 5. Audio
  audio: {
    sampleRate: 44100 | 48000 | 96000;
    bufferSize: 256 | 512 | 1024;
    peakMonitoring: boolean;
    autoDeclip: boolean;
  };
  // 6. Export
  export: {
    defaultCodec: 'H.264' | 'ProRes 422' | 'AV1' | 'PNG Sequence';
    hardwareAcceleration: boolean;
    colorSpace: 'Rec.709' | 'sRGB' | 'P3-D65';
    exportBitrateMbps: number;
  };
  // 7. Backup & Sync
  backup: {
    autosaveIntervalSec: 15 | 30 | 60 | 120;
    cloudSyncEnabled: boolean;
    keepLocalRevisionsCount: number;
    autoCreateVersionOnExport: boolean;
  };
  // 8. Notifications
  notifications: {
    renderCompleted: boolean;
    creditThresholdAlert: boolean;
    ownerAnnouncement: boolean;
    soundEffects: boolean;
  };
  // 9. Accessibility
  accessibility: {
    fontSizeScale: 'standard' | 'large' | 'larger';
    screenReaderOptimized: boolean;
    monochromeWaveforms: boolean;
  };
  // 10. Performance & Storage
  performance: {
    gpuAcceleration: boolean;
    previewProxyResolution: 'full' | 'half' | 'quarter';
    maxDiskCacheGB: number;
    allocatedMemoryGB: number;
  };
  // 11. Language
  language: {
    currentLanguage: 'en' | 'hi' | 'de' | 'fr' | 'es' | 'ja' | 'zh';
    timecodeFormat: 'smpte' | 'milliseconds' | 'frames';
  };
  // 12. Pro
  pro: {
    autoRenew: boolean;
    alertBeforeExpiryDays: number;
  };
  // 13. Advanced
  advanced: {
    developerLogsEnabled: boolean;
    showDebugStats: boolean;
    customApiEndpoint: string;
    experimentalCodecs: boolean;
  };
  // 14. About
  about: {
    version: string;
    buildNumber: string;
    releaseChannel: 'production' | 'beta';
    engineArchitecture: string;
  };
}
