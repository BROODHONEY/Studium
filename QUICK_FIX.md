# Quick Fix - Copy & Paste This SQL

## Step 1: Go to Supabase SQL Editor

## Step 2: Copy and Paste This Entire Block

```sql
-- Drop existing table if any
DROP TABLE IF EXISTS report_templates CASCADE;

-- Create fresh table
CREATE TABLE report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL,
  college_name TEXT,
  show_college_name BOOLEAN DEFAULT true,
  college_name_position TEXT DEFAULT 'top-center',
  logo_url TEXT,
  logo_position TEXT DEFAULT 'top-center',
  logo_size TEXT DEFAULT 'medium',
  font_size INTEGER DEFAULT 12,
  header_color TEXT DEFAULT '#FF6B35',
  show_logo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(institution_id)
);

CREATE INDEX idx_report_templates_institution_id ON report_templates(institution_id);

CREATE OR REPLACE FUNCTION update_report_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_report_templates_updated_at
  BEFORE UPDATE ON report_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_report_templates_updated_at();
```

## Step 3: Click "Run" (or press Ctrl+Enter)

## Step 4: Restart Backend

```bash
# Stop server (Ctrl+C)
cd backend
npm start
```

## Step 5: Test

1. Refresh admin page
2. Go to Report Templates
3. Fill in college name
4. Click "Save Template"
5. Should see ✅ "Template saved successfully!"

## Done! 🎉

If you still see errors, check `FINAL_FIX_SCHEMA.md` for troubleshooting steps.
