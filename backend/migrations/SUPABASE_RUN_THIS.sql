-- ============================================
-- COMBINED MIGRATION FOR SUPABASE
-- Run this entire file in Supabase SQL Editor
-- ============================================

-- This combines all necessary migrations for the Institution Admin Dashboard
-- Safe to run multiple times (uses IF NOT EXISTS)

-- ============================================
-- 1. ADD ADMIN ROLE TO USERS
-- ============================================

-- Drop existing constraint if it exists
DO $$ BEGIN
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Add new constraint with admin role
DO $$ BEGIN
    ALTER TABLE users ADD CONSTRAINT users_role_check 
        CHECK (role IN ('student', 'teacher', 'admin'));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 2. UPDATE INSTITUTIONS TABLE
-- ============================================

-- Add new columns for onboarding
DO $$ BEGIN
    ALTER TABLE institutions ADD COLUMN IF NOT EXISTS contact_name VARCHAR(255);
    ALTER TABLE institutions ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
    ALTER TABLE institutions ADD COLUMN IF NOT EXISTS address TEXT;
    ALTER TABLE institutions ADD COLUMN IF NOT EXISTS student_count INTEGER;
    ALTER TABLE institutions ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(20);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Add check constraint for billing_cycle
DO $$ BEGIN
    ALTER TABLE institutions ADD CONSTRAINT institutions_billing_cycle_check 
        CHECK (billing_cycle IN ('monthly', 'yearly'));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 3. ADD USER DETAILS COLUMNS
-- ============================================

DO $$ BEGIN
    -- Add faculty_role column (for teachers)
    ALTER TABLE users ADD COLUMN IF NOT EXISTS faculty_role VARCHAR(100);
    
    -- Add roll_no column (for students)
    ALTER TABLE users ADD COLUMN IF NOT EXISTS roll_no VARCHAR(100);
    
    -- Add year column (for students)
    ALTER TABLE users ADD COLUMN IF NOT EXISTS year INTEGER;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_users_faculty_role ON users(faculty_role);
CREATE INDEX IF NOT EXISTS idx_users_roll_no ON users(roll_no);
CREATE INDEX IF NOT EXISTS idx_users_year ON users(year);

-- Add comments for documentation
COMMENT ON COLUMN users.faculty_role IS 'Faculty role for teachers: HOD, Academic Head, DC, Professor, Assistant Professor, Associate Professor';
COMMENT ON COLUMN users.roll_no IS 'Roll number for students';
COMMENT ON COLUMN users.year IS 'Academic year for students (1-4)';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check users table structure
SELECT 
    'Users table columns:' as info,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
    AND column_name IN ('role', 'faculty_role', 'roll_no', 'year', 'department_id', 'institution_id')
ORDER BY ordinal_position;

-- Check institutions table structure
SELECT 
    'Institutions table columns:' as info,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'institutions'
    AND column_name IN ('contact_name', 'phone', 'address', 'student_count', 'billing_cycle')
ORDER BY ordinal_position;

-- Check departments table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'departments')
        THEN 'Departments table exists ✓'
        ELSE 'Departments table missing ✗'
    END as status;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

SELECT '✓ Migration completed successfully!' as result;
SELECT 'You can now test the Institution Admin Dashboard' as next_step;
