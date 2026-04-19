-- Run this in your Supabase SQL editor to create the selection groups table

CREATE TABLE IF NOT EXISTS teacher_selection_groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  student_ids UUID[] NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast teacher lookups
CREATE INDEX IF NOT EXISTS idx_teacher_selection_groups_teacher_id
  ON teacher_selection_groups(teacher_id);

-- RLS: teachers can only see/edit their own groups
ALTER TABLE teacher_selection_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teacher_own_groups" ON teacher_selection_groups
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());
