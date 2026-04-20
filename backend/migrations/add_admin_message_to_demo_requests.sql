-- Add admin_message column to demo_requests table
-- Update demo_request_status enum to include 'approved'

-- Update the enum type to include 'approved' status
ALTER TYPE demo_request_status ADD VALUE IF NOT EXISTS 'approved';

-- Add admin_message column
ALTER TABLE demo_requests 
ADD COLUMN IF NOT EXISTS admin_message TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_demo_requests_email ON demo_requests(email);

-- Update status column to use the new enum (if needed)
COMMENT ON COLUMN demo_requests.admin_message IS 'Message from admin when approving or rejecting the request';
COMMENT ON COLUMN demo_requests.status IS 'Status: pending, approved, contacted, converted, rejected';
