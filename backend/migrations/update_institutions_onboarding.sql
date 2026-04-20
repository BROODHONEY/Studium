-- Add additional fields to institutions table for onboarding

ALTER TABLE institutions 
ADD COLUMN IF NOT EXISTS contact_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS student_count INTEGER,
ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly'));

-- Update existing records to have default billing_cycle
UPDATE institutions SET billing_cycle = 'monthly' WHERE billing_cycle IS NULL;

-- Add comment
COMMENT ON COLUMN institutions.contact_name IS 'Primary contact person name';
COMMENT ON COLUMN institutions.phone IS 'Institution contact phone number';
COMMENT ON COLUMN institutions.address IS 'Institution physical address';
COMMENT ON COLUMN institutions.student_count IS 'Approximate number of students';
COMMENT ON COLUMN institutions.billing_cycle IS 'Subscription billing cycle: monthly or yearly';
