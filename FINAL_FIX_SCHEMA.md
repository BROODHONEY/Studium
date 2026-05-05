# Final Fix: Schema Cache Error

## Problem
Error: `Could not find the 'college_name' column of 'report_templates' in the schema cache`

This means either:
1. The table was created with different column names
2. The table doesn't exist yet
3. Supabase schema cache needs refresh

## Solution: Run This SQL in Supabase

Go to **Supabase Dashboard → SQL Editor** and run this:

```sql
-- Drop the table if it exists (to start fresh)
DROP TABLE IF EXISTS report_templates CASCADE;

-- Create the table with correct schema
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

-- Create index
CREATE INDEX idx_report_templates_institution_id 
  ON report_templates(institution_id);

-- Create trigger for updated_at
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

-- Verify the table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'report_templates'
ORDER BY ordinal_position;
```

## Expected Output

You should see these columns:
- id (uuid)
- institution_id (uuid)
- college_name (text)
- show_college_name (boolean)
- college_name_position (text)
- logo_url (text)
- logo_position (text)
- logo_size (text)
- font_size (integer)
- header_color (text)
- show_logo (boolean)
- created_at (timestamp with time zone)
- updated_at (timestamp with time zone)

## After Running SQL

1. **Restart your backend server** (important!)
   ```bash
   # Press Ctrl+C
   cd backend
   npm start
   ```

2. **Refresh the admin page** (Ctrl+Shift+R)

3. **Try saving the template again**

## Success!

You should now see:
✅ "Template saved successfully!" message
✅ No errors in console
✅ Settings persist after refresh

## If Still Not Working

### Option 1: Check if table exists
```sql
SELECT * FROM report_templates;
```

### Option 2: Check column names
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'report_templates';
```

### Option 3: Manually insert a test record
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
  'acef1d9a-8c39-40f5-a426-774970a04769',
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

If this works, then the issue is with Supabase's schema cache. Try:
1. Refreshing the Supabase dashboard
2. Restarting your backend
3. Clearing browser cache

## Note About Foreign Keys

I removed the foreign key constraint to `institutions` table to avoid dependency issues. If you want to add it back later:

```sql
ALTER TABLE report_templates
ADD CONSTRAINT fk_institution
FOREIGN KEY (institution_id) 
REFERENCES institutions(id) 
ON DELETE CASCADE;
```

Only add this if you're sure the `institutions` table exists and has the correct structure.
