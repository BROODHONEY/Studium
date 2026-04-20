-- Add 'admin' role to users table role check constraint

-- Drop the existing constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new constraint that includes 'admin'
ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('student', 'teacher', 'admin'));

-- Update any existing records if needed
-- (This is safe to run even if no records exist)
