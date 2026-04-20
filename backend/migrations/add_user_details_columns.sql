-- Add faculty_role, roll_no, and year columns to users table
-- This allows institution admins to assign specific roles to teachers and track student details

DO $ BEGIN
    -- Add faculty_role column if it doesn't exist (for teachers)
    ALTER TABLE users ADD COLUMN IF NOT EXISTS faculty_role VARCHAR(100);
    
    -- Add roll_no column if it doesn't exist (for students)
    ALTER TABLE users ADD COLUMN IF NOT EXISTS roll_no VARCHAR(100);
    
    -- Add year column if it doesn't exist (for students)
    ALTER TABLE users ADD COLUMN IF NOT EXISTS year INTEGER;
EXCEPTION
    WHEN duplicate_column THEN null;
END $;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_users_faculty_role ON users(faculty_role);
CREATE INDEX IF NOT EXISTS idx_users_roll_no ON users(roll_no);
CREATE INDEX IF NOT EXISTS idx_users_year ON users(year);

-- Add comments for documentation
COMMENT ON COLUMN users.faculty_role IS 'Faculty role for teachers: HOD, Academic Head, DC, Professor, Assistant Professor, Associate Professor';
COMMENT ON COLUMN users.roll_no IS 'Roll number for students';
COMMENT ON COLUMN users.year IS 'Academic year for students (1-4)';
