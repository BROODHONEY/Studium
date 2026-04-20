-- Multi-tenant architecture for Studi+
-- PostgreSQL version
-- This schema supports multiple institutions with isolated data

-- Create ENUM types
DO $$ BEGIN
    CREATE TYPE institution_plan AS ENUM ('basic', 'premium', 'enterprise');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE institution_status AS ENUM ('active', 'suspended', 'trial');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE demo_request_status AS ENUM ('pending', 'contacted', 'converted', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE usage_metric_type AS ENUM ('users', 'storage', 'messages', 'files');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Parent table for all institutions
CREATE TABLE IF NOT EXISTS institutions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    plan institution_plan DEFAULT 'basic',
    status institution_status DEFAULT 'trial',
    max_users INTEGER DEFAULT 1000,
    max_storage_gb INTEGER DEFAULT 50,
    custom_branding JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_institutions_subdomain ON institutions(subdomain);
CREATE INDEX IF NOT EXISTS idx_institutions_status ON institutions(status);

-- Demo requests table
CREATE TABLE IF NOT EXISTS demo_requests (
    id SERIAL PRIMARY KEY,
    institution_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    student_count INTEGER,
    message TEXT,
    status demo_request_status DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_demo_requests_status ON demo_requests(status);
CREATE INDEX IF NOT EXISTS idx_demo_requests_created ON demo_requests(created_at);

-- Add institution_id to existing tables (if they exist)
DO $$ BEGIN
    ALTER TABLE users ADD COLUMN IF NOT EXISTS institution_id INTEGER NOT NULL;
    ALTER TABLE users ADD CONSTRAINT fk_users_institution 
        FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN undefined_table THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_institution ON users(institution_id);

DO $$ BEGIN
    ALTER TABLE groups ADD COLUMN IF NOT EXISTS institution_id INTEGER NOT NULL;
    ALTER TABLE groups ADD CONSTRAINT fk_groups_institution 
        FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN undefined_table THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_groups_institution ON groups(institution_id);

DO $$ BEGIN
    ALTER TABLE messages ADD COLUMN IF NOT EXISTS institution_id INTEGER NOT NULL;
    ALTER TABLE messages ADD CONSTRAINT fk_messages_institution 
        FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN undefined_table THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_messages_institution ON messages(institution_id);

DO $$ BEGIN
    ALTER TABLE files ADD COLUMN IF NOT EXISTS institution_id INTEGER NOT NULL;
    ALTER TABLE files ADD CONSTRAINT fk_files_institution 
        FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN undefined_table THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_files_institution ON files(institution_id);

DO $$ BEGIN
    ALTER TABLE dues ADD COLUMN IF NOT EXISTS institution_id INTEGER NOT NULL;
    ALTER TABLE dues ADD CONSTRAINT fk_dues_institution 
        FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN undefined_table THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_dues_institution ON dues(institution_id);

DO $$ BEGIN
    ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS institution_id INTEGER NOT NULL;
    ALTER TABLE quizzes ADD CONSTRAINT fk_quizzes_institution 
        FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN undefined_table THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_quizzes_institution ON quizzes(institution_id);

-- Institution settings table
CREATE TABLE IF NOT EXISTS institution_settings (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
    UNIQUE (institution_id, setting_key)
);

-- Institution usage tracking
CREATE TABLE IF NOT EXISTS institution_usage (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER NOT NULL,
    metric_type usage_metric_type NOT NULL,
    metric_value BIGINT NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_institution_usage_metric ON institution_usage(institution_id, metric_type, recorded_at);

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_institutions_updated_at ON institutions;
CREATE TRIGGER update_institutions_updated_at BEFORE UPDATE ON institutions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_demo_requests_updated_at ON demo_requests;
CREATE TRIGGER update_demo_requests_updated_at BEFORE UPDATE ON demo_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_institution_settings_updated_at ON institution_settings;
CREATE TRIGGER update_institution_settings_updated_at BEFORE UPDATE ON institution_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample institution for testing
INSERT INTO institutions (name, subdomain, contact_email, plan, status) 
VALUES ('ABC College', 'abc', 'admin@abc.edu', 'premium', 'active')
ON CONFLICT (subdomain) DO NOTHING;
