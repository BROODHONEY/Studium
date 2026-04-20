-- Department-based content segregation schema
-- PostgreSQL version
-- This extends the multi-tenant architecture with department-level organization

-- Create ENUM types
DO $$ BEGIN
    CREATE TYPE resource_type AS ENUM ('template', 'curriculum', 'report', 'material', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE info_type AS ENUM ('announcement', 'policy', 'schedule', 'contact', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE template_type AS ENUM ('student_report', 'progress_report', 'assessment', 'attendance', 'custom');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    head_teacher_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
    UNIQUE (institution_id, code)
);

CREATE INDEX IF NOT EXISTS idx_departments_institution ON departments(institution_id);

-- Add department_id to users table
DO $$ BEGIN
    ALTER TABLE users ADD COLUMN IF NOT EXISTS department_id INTEGER;
    ALTER TABLE users ADD CONSTRAINT fk_users_department 
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN undefined_table THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_department ON users(department_id);

-- Add department_id to groups table
DO $$ BEGIN
    ALTER TABLE groups ADD COLUMN IF NOT EXISTS department_id INTEGER;
    ALTER TABLE groups ADD CONSTRAINT fk_groups_department 
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN undefined_table THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_groups_department ON groups(department_id);

-- Teacher resources table (for file sharing and templates)
CREATE TABLE IF NOT EXISTS teacher_resources (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER NOT NULL,
    department_id INTEGER,
    uploaded_by INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_path VARCHAR(500),
    file_type VARCHAR(100),
    file_size BIGINT,
    resource_type resource_type DEFAULT 'other',
    category VARCHAR(100),
    tags JSONB,
    is_public BOOLEAN DEFAULT FALSE,
    download_count INTEGER DEFAULT 0,
    folder_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_teacher_resources_institution ON teacher_resources(institution_id);
CREATE INDEX IF NOT EXISTS idx_teacher_resources_department ON teacher_resources(department_id);
CREATE INDEX IF NOT EXISTS idx_teacher_resources_type ON teacher_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_teacher_resources_uploader ON teacher_resources(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_teacher_resources_folder ON teacher_resources(folder_id);

-- Resource folders for organization
CREATE TABLE IF NOT EXISTS resource_folders (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER NOT NULL,
    department_id INTEGER,
    parent_folder_id INTEGER,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_folder_id) REFERENCES resource_folders(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_resource_folders_institution ON resource_folders(institution_id);
CREATE INDEX IF NOT EXISTS idx_resource_folders_department ON resource_folders(department_id);
CREATE INDEX IF NOT EXISTS idx_resource_folders_parent ON resource_folders(parent_folder_id);

-- Add foreign key for folder_id in teacher_resources
DO $$ BEGIN
    ALTER TABLE teacher_resources ADD CONSTRAINT fk_resources_folder 
        FOREIGN KEY (folder_id) REFERENCES resource_folders(id) ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Department curriculum table
CREATE TABLE IF NOT EXISTS department_curriculum (
    id SERIAL PRIMARY KEY,
    department_id INTEGER NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    semester VARCHAR(20),
    course_code VARCHAR(50) NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    credits INTEGER,
    syllabus TEXT,
    objectives TEXT,
    outcomes TEXT,
    textbooks JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_department_curriculum_department ON department_curriculum(department_id);
CREATE INDEX IF NOT EXISTS idx_department_curriculum_year ON department_curriculum(academic_year);

-- Department information/announcements
CREATE TABLE IF NOT EXISTS department_info (
    id SERIAL PRIMARY KEY,
    department_id INTEGER NOT NULL,
    info_type info_type DEFAULT 'other',
    title VARCHAR(255) NOT NULL,
    content TEXT,
    attachments JSONB,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_department_info_department ON department_info(department_id);
CREATE INDEX IF NOT EXISTS idx_department_info_type ON department_info(info_type);
CREATE INDEX IF NOT EXISTS idx_department_info_pinned ON department_info(is_pinned);

-- Report templates
CREATE TABLE IF NOT EXISTS report_templates (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER NOT NULL,
    department_id INTEGER,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_type template_type DEFAULT 'custom',
    template_data JSONB,
    file_path VARCHAR(500),
    created_by INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_report_templates_institution ON report_templates(institution_id);
CREATE INDEX IF NOT EXISTS idx_report_templates_department ON report_templates(department_id);
CREATE INDEX IF NOT EXISTS idx_report_templates_type ON report_templates(template_type);

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_departments_updated_at ON departments;
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_teacher_resources_updated_at ON teacher_resources;
CREATE TRIGGER update_teacher_resources_updated_at BEFORE UPDATE ON teacher_resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_resource_folders_updated_at ON resource_folders;
CREATE TRIGGER update_resource_folders_updated_at BEFORE UPDATE ON resource_folders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_department_curriculum_updated_at ON department_curriculum;
CREATE TRIGGER update_department_curriculum_updated_at BEFORE UPDATE ON department_curriculum
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_department_info_updated_at ON department_info;
CREATE TRIGGER update_department_info_updated_at BEFORE UPDATE ON department_info
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_report_templates_updated_at ON report_templates;
CREATE TRIGGER update_report_templates_updated_at BEFORE UPDATE ON report_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample departments (only insert if institution exists)
DO $$
DECLARE
    inst_id INTEGER;
BEGIN
    SELECT id INTO inst_id FROM institutions WHERE subdomain = 'abc' LIMIT 1;
    
    IF inst_id IS NOT NULL THEN
        INSERT INTO departments (institution_id, name, code, description) 
        VALUES 
            (inst_id, 'Computer Science', 'CS', 'Department of Computer Science and Engineering'),
            (inst_id, 'Artificial Intelligence and Machine Learning', 'AIML', 'Department of AIML'),
            (inst_id, 'Artificial Intelligence and Data Science', 'AIDS', 'Department of AIDS')
        ON CONFLICT (institution_id, code) DO NOTHING;
    END IF;
END $$;
