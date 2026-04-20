-- Run this in your Supabase SQL editor

ALTER TABLE users ADD COLUMN IF NOT EXISTS semester_marks JSONB DEFAULT '[]'::jsonb;

-- semester_marks structure:
-- [
--   {
--     "semester": 1,
--     "gpa": 8.5,
--     "courses": [
--       { "code": "CS101", "name": "Intro to Programming", "credits": 4, "grade": "A", "marks": 92 },
--       ...
--     ]
--   },
--   ...
-- ]
