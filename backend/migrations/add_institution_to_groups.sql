-- Add institution_id to groups table for multi-tenant isolation
-- This ensures groups are scoped to institutions

-- Add institution_id column to groups if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'groups' AND column_name = 'institution_id'
  ) THEN
    ALTER TABLE groups ADD COLUMN institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE;
    
    -- Create index for faster queries
    CREATE INDEX IF NOT EXISTS idx_groups_institution_id ON groups(institution_id);
    
    -- Create composite index for invite code lookups within institution
    CREATE INDEX IF NOT EXISTS idx_groups_institution_invite ON groups(institution_id, invite_code);
  END IF;
END $$;

-- Update existing groups to have institution_id based on the creator's institution
-- This is a one-time migration for existing data
UPDATE groups g
SET institution_id = u.institution_id
FROM users u
WHERE g.created_by = u.id
  AND g.institution_id IS NULL;

-- Make institution_id NOT NULL after backfilling
ALTER TABLE groups ALTER COLUMN institution_id SET NOT NULL;

-- Add RLS (Row Level Security) policies for groups
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see groups from their institution
CREATE POLICY groups_institution_isolation ON groups
  FOR SELECT
  USING (
    institution_id IN (
      SELECT institution_id FROM users WHERE id = auth.uid()
    )
  );

-- Policy: Only teachers can create groups in their institution
CREATE POLICY groups_create_policy ON groups
  FOR INSERT
  WITH CHECK (
    institution_id IN (
      SELECT institution_id FROM users WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- Policy: Only group creators or admins can update groups
CREATE POLICY groups_update_policy ON groups
  FOR UPDATE
  USING (
    created_by = auth.uid() OR
    id IN (
      SELECT group_id FROM group_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Only group creators can delete groups
CREATE POLICY groups_delete_policy ON groups
  FOR DELETE
  USING (created_by = auth.uid());
