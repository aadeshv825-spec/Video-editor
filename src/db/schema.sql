-- ==============================================================================
-- VYRO AI STUDIO — ENTERPRISE POSTGRESQL / CLOUD SQL PRODUCTION SCHEMA
-- ==============================================================================
-- Designed for PostgreSQL 14+ / Google Cloud SQL / AWS RDS / Aurora PostgreSQL
-- Fully isolated multi-tenant architecture with Row-Level Security (RLS) support,
-- monotonic project versioning, and immutable audit logs.
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. USERS & PROFILES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'user' CHECK (role IN ('owner', 'admin', 'creator', 'user')),
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    is_pro BOOLEAN NOT NULL DEFAULT FALSE,
    pro_source VARCHAR(32) CHECK (pro_source IN ('subscription', 'owner_grant', 'trial')),
    pro_expires_at TIMESTAMPTZ,
    ai_credits INTEGER NOT NULL DEFAULT 500 CHECK (ai_credits >= 0),
    beta_access BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ------------------------------------------------------------------------------
-- 2. USER AUTHENTICATION METADATA (Never exposed to client)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_auth_credentials (
    user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    auth_provider VARCHAR(32) NOT NULL DEFAULT 'email',
    password_hash VARCHAR(255),
    password_salt VARCHAR(64),
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    email_verification_token VARCHAR(128),
    reset_token VARCHAR(128),
    reset_token_expires_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. PROJECTS & REVISION METADATA
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(64) PRIMARY KEY,
    owner_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(32) NOT NULL CHECK (type IN ('video', 'photo', 'audio', 'director', 'tools', 'generate', 'templates')),
    aspect_ratio VARCHAR(16) NOT NULL DEFAULT '16:9',
    resolution VARCHAR(16) NOT NULL DEFAULT '1080p',
    fps INTEGER NOT NULL DEFAULT 30,
    project_version INTEGER NOT NULL DEFAULT 1,
    revision_id VARCHAR(64) NOT NULL,
    device_id VARCHAR(64) NOT NULL,
    sync_status VARCHAR(32) NOT NULL DEFAULT 'synced',
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    autosaved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cloud_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at);

-- Project state payload (JSONB for fast querying and atomic updates)
CREATE TABLE IF NOT EXISTS project_state (
    project_id VARCHAR(64) PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
    state_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    export_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. PROJECT VERSIONS (Non-destructive snapshots)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_versions (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    owner_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    action_count INTEGER NOT NULL DEFAULT 0,
    preview_url TEXT,
    snapshot_payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_project_versions ON project_versions(project_id, version_number DESC);

-- ------------------------------------------------------------------------------
-- 5. LARGE MEDIA ASSETS & STORAGE METADATA
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS media_assets (
    id VARCHAR(64) PRIMARY KEY,
    owner_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id VARCHAR(64) REFERENCES projects(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(32) NOT NULL CHECK (type IN ('video', 'audio', 'image')),
    size_bytes BIGINT NOT NULL CHECK (size_bytes >= 0),
    duration_sec NUMERIC(10, 2),
    dimensions VARCHAR(32),
    storage_provider VARCHAR(32) NOT NULL DEFAULT 'local' CHECK (storage_provider IN ('gcs', 's3', 'local')),
    storage_bucket VARCHAR(255),
    storage_key VARCHAR(512) NOT NULL,
    mime_type VARCHAR(128) NOT NULL,
    etag VARCHAR(64),
    status VARCHAR(32) NOT NULL DEFAULT 'ready' CHECK (status IN ('uploading', 'ready', 'trashed', 'purged')),
    trashed_at TIMESTAMPTZ,
    purge_scheduled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_owner ON media_assets(owner_id, status);
CREATE INDEX IF NOT EXISTS idx_media_project ON media_assets(project_id);
CREATE INDEX IF NOT EXISTS idx_media_purge ON media_assets(status, purge_scheduled_at);

-- ------------------------------------------------------------------------------
-- 6. SUBSCRIPTIONS & PRO ENTITLEMENTS (Server Authoritative)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id VARCHAR(32) NOT NULL CHECK (plan_id IN ('monthly', 'three_months', 'six_months', 'yearly', 'owner_grant')),
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'expired')),
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expiry_date TIMESTAMPTZ NOT NULL,
    is_trial BOOLEAN NOT NULL DEFAULT FALSE,
    gateway VARCHAR(32) NOT NULL DEFAULT 'not_configured' CHECK (gateway IN ('razorpay', 'stripe', 'google_play', 'app_store', 'not_configured')),
    gateway_order_id VARCHAR(255),
    gateway_payment_id VARCHAR(255),
    gateway_subscription_id VARCHAR(255),
    amount INTEGER NOT NULL DEFAULT 0,
    currency VARCHAR(8) NOT NULL DEFAULT 'INR',
    auto_renew BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id, status);

-- ------------------------------------------------------------------------------
-- 7. AI CREDITS & TRANSACTION LEDGER
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS credit_transactions (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(32) NOT NULL CHECK (type IN ('trial_grant', 'pro_inclusion', 'owner_grant', 'owner_deduction', 'credit_pack_purchase', 'ai_usage', 'refund_failed_job')),
    reason TEXT NOT NULL,
    credits_added INTEGER NOT NULL DEFAULT 0,
    credits_consumed INTEGER NOT NULL DEFAULT 0,
    balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
    related_job_id VARCHAR(64),
    model_provider VARCHAR(64),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_tx_user ON credit_transactions(user_id, timestamp DESC);

-- Atomic credit reservations
CREATE TABLE IF NOT EXISTS credit_reservations (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id VARCHAR(64) NOT NULL UNIQUE,
    amount INTEGER NOT NULL CHECK (amount > 0),
    status VARCHAR(32) NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'settled', 'released')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_credit_reservations_user ON credit_reservations(user_id, status);

-- ------------------------------------------------------------------------------
-- 8. AI JOB RECORDS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_jobs (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id VARCHAR(64) REFERENCES projects(id) ON DELETE SET NULL,
    model_id VARCHAR(64) NOT NULL,
    provider VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    cost_credits INTEGER NOT NULL DEFAULT 0,
    actual_provider_cost_usd NUMERIC(8, 4),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ai_jobs_user ON ai_jobs(user_id, status);

-- ------------------------------------------------------------------------------
-- 9. USER BACKUPS & RECOVERY
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_backups (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    backup_type VARCHAR(32) NOT NULL DEFAULT 'manual' CHECK (backup_type IN ('auto', 'manual')),
    project_count INTEGER NOT NULL DEFAULT 0,
    size_bytes BIGINT NOT NULL DEFAULT 0,
    metadata_payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_backups_user ON user_backups(user_id, created_at DESC);

-- ------------------------------------------------------------------------------
-- 10. IMMUTABLE AUDIT LOGS (Owner & System Governance)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    actor_id VARCHAR(64) NOT NULL,
    actor_name VARCHAR(255) NOT NULL,
    actor_role VARCHAR(32) NOT NULL,
    action VARCHAR(64) NOT NULL,
    target_user_id VARCHAR(64),
    target_user_name VARCHAR(255),
    details TEXT NOT NULL,
    previous_value TEXT,
    new_value TEXT,
    ip_address VARCHAR(45),
    correlation_id VARCHAR(64),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(target_user_id);
