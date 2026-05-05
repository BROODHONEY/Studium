# Fix: Report Template Save Error (500)

## Problem
When clicking "Save Template" in the Report Templates panel, you get a 500 Internal Server Error.

## Root Cause
The `report_templates` table doesn't exist in your Supabase database yet.

## Solution

### Step 1: Create the Database Table

Go to your **Supabase Dashboard** → **SQL Editor** and run this SQL:

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
CREATE INDEX IF NOT EXISTS idx_report_templates_institution_id 
  ON report_templates(institution_id);

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

### Step 2: Verify Table Creation

Run this query to verify:

```sql
SELECT * FROM report_templates;
```

You should see an empty table (no rows, but the table exists).

### Step 3: Restart Backend Server

```bash
# Stop the backend server (Ctrl+C)
# Then restart it
cd backend
npm start
```

### Step 4: Test Again

1. Go to Admin Dashboard → Report Templates
2. Fill in the college name
3. Click "Save Template"
4. You should see "Template saved successfully!" message

## What Was Fixed

1. ✅ Created database migration file
2. ✅ Added better error handling in backend
3. ✅ Added helpful error messages in frontend
4. ✅ Added detailed logging for debugging

## Files Modified

- `backend/routes/reportTemplates.js` - Better error handling
- `frontend/src/components/ReportTemplatePanel.jsx` - Better error messages
- `backend/migrations/create_report_templates_table.sql` - New migration
- `backend/scripts/run-report-templates-migration.js` - Migration script

## Alternative: Run Migration Script

If you prefer, you can run the migration via Node.js:

```bash
cd backend
node scripts/run-report-templates-migration.js
```

However, running directly in Supabase SQL Editor is more reliable.

## Troubleshooting

### Error: "relation 'institutions' does not exist"

Your database doesn't have an institutions table. You need to create it first or modify the foreign key constraint.

**Quick fix:** Remove the foreign key constraint:

```sql
CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL,  -- Removed REFERENCES
  -- ... rest of columns
);
```

### Error: "Admin only"

Make sure you're logged in as an admin user. Check your user role:

```sql
SELECT id, email, role, institution_id FROM users WHERE email = 'your-email@example.com';
```

### Still Getting 500 Error

Check the backend console logs for detailed error messages. The improved error handling will show you exactly what's wrong.

## Success Indicators

✅ No error message when saving
✅ Green success message appears
✅ Preview updates with your settings
✅ Settings persist after page refresh
