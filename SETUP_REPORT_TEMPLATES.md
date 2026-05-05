# Setup Report Templates Table

## Quick Fix for the 500 Error

The error occurs because the `report_templates` table doesn't exist in your database yet. Follow these steps to create it:

## Option 1: Run via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy and paste the SQL below
5. Click **Run** or press `Ctrl+Enter`

```sql
-- Create report_templates table
CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
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

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_report_templates_institution_id ON report_templates(institution_id);

-- Add updated_at trigger
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

## Option 2: Run via Node Script

```bash
cd backend
node scripts/run-report-templates-migration.js
```

## Verify the Table was Created

Run this query in Supabase SQL Editor to verify:

```sql
SELECT * FROM report_templates;
```

You should see an empty table with the correct columns.

## After Setup

1. Restart your backend server if it's running
2. Refresh the admin dashboard
3. Try saving the template again

The error should be resolved!

## Troubleshooting

If you still see errors:

1. **Check if institutions table exists:**
   ```sql
   SELECT * FROM institutions LIMIT 1;
   ```

2. **Check your user's institution_id:**
   ```sql
   SELECT id, email, institution_id, role FROM users WHERE role = 'admin';
   ```

3. **Manually insert a test template:**
   ```sql
   INSERT INTO report_templates (
     institution_id,
     college_name,
     show_college_name,
     college_name_position,
     logo_url,
     logo_position,
     logo_size,
     font_size,
     header_color,
     show_logo
   ) VALUES (
     'YOUR_INSTITUTION_ID_HERE',
     'Test College',
     true,
     'top-center',
     null,
     'top-center',
     'medium',
     12,
     '#FF6B35',
     true
   );
   ```

## RLS Policies (Optional - for additional security)

If you want to add Row Level Security policies:

```sql
-- Enable RLS
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their institution's template
CREATE POLICY "Users can view their institution template"
  ON report_templates
  FOR SELECT
  USING (institution_id IN (
    SELECT institution_id FROM users WHERE id = auth.uid()
  ));

-- Policy: Admins can insert their institution's template
CREATE POLICY "Admins can insert their institution template"
  ON report_templates
  FOR INSERT
  WITH CHECK (institution_id IN (
    SELECT institution_id FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Policy: Admins can update their institution's template
CREATE POLICY "Admins can update their institution template"
  ON report_templates
  FOR UPDATE
  USING (institution_id IN (
    SELECT institution_id FROM users WHERE id = auth.uid() AND role = 'admin'
  ));
```

Note: RLS policies require that you're using Supabase Auth. If you're using custom JWT auth, you may need to adjust these policies or skip them.
