# Supabase Setup Guide for Institution Admin Dashboard

## Running Migrations in Supabase

### Quick Start (Easiest Method)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **+ New query**
4. Open the file: `backend/migrations/SUPABASE_RUN_THIS.sql`
5. Copy ALL the content and paste into the SQL Editor
6. Click **Run** (or press Ctrl/Cmd + Enter)
7. Wait for success message

That's it! This single file contains all necessary migrations.

### What This Migration Does

- ✅ Adds 'admin' role to users table
- ✅ Adds onboarding fields to institutions table (contact_name, phone, address, student_count, billing_cycle)
- ✅ Adds faculty_role column for teachers
- ✅ Adds roll_no and year columns for students
- ✅ Creates necessary indexes
- ✅ Verifies the migration completed successfully

### Individual Migrations (Alternative)

If you prefer to run migrations separately, run these in order:

1. `add_admin_role.sql` - Adds 'admin' to allowed roles
2. `update_institutions_onboarding.sql` - Adds onboarding fields
3. `departments_schema.sql` - Creates departments table (if not exists)
4. `add_user_details_columns.sql` - Adds user detail columns

### Option 2: Supabase CLI

If you have Supabase CLI installed:

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### Option 3: Direct SQL Execution

You can also combine all migrations into one file and run it:

```bash
# In Supabase SQL Editor, paste and run:
```

## Quick Setup Steps

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "+ New query"

3. **Run Each Migration**
   - Copy the content from `backend/migrations/add_user_details_columns.sql`
   - Paste into the SQL Editor
   - Click "Run" (or press Ctrl/Cmd + Enter)
   - Wait for success message

4. **Verify Tables**
   - Go to "Table Editor" in the left sidebar
   - Check that these tables exist:
     - institutions
     - demo_requests
     - departments
   - Check that users table has these columns:
     - institution_id
     - department_id
     - faculty_role
     - roll_no
     - year

## Testing the Setup

### 1. Create a Test Institution

Run this in SQL Editor to create a test institution:

```sql
-- Create test institution
INSERT INTO institutions (name, subdomain, contact_email, plan, status)
VALUES ('Test University', 'testun', 'admin@test.edu', 'premium', 'active')
RETURNING *;
```

### 2. Create Admin User

```sql
-- First, get the institution ID from the previous query
-- Then create admin user (replace PASSWORD_HASH with actual bcrypt hash)

INSERT INTO users (
  name, 
  email, 
  password_hash, 
  role, 
  institution_id
)
VALUES (
  'Admin User',
  'admin@test.edu',
  '$2b$10$YourBcryptHashHere', -- Generate this using bcrypt
  'admin',
  1 -- Replace with actual institution_id
)
RETURNING id, name, email, role, institution_id;
```

### 3. Test Login Flow

1. Go to your frontend: `http://localhost:5173/institution-select`
2. Enter institution code: `testun`
3. Login with: `admin@test.edu` / `your_password`
4. Should redirect to: `/admin/dashboard`

## Generating Password Hash

To generate a bcrypt hash for testing:

```javascript
// Run in Node.js or browser console
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash('password123', 10);
console.log(hash);
```

Or use an online bcrypt generator: https://bcrypt-generator.com/

## Checking Migration Status

Run this query in SQL Editor to verify all columns exist:

```sql
-- Check users table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Check if departments table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'departments'
);

-- Check institutions table
SELECT * FROM institutions LIMIT 5;
```

## Troubleshooting

### Error: "relation does not exist"
- Make sure you ran all migrations in order
- Check that you're in the correct database/schema

### Error: "column already exists"
- This is safe to ignore - the migration uses `IF NOT EXISTS`
- The column was already added in a previous run

### Error: "violates check constraint"
- Make sure you ran `add_admin_role.sql` migration
- This adds 'admin' to the allowed roles

### Cannot see tables in Table Editor
- Refresh the page
- Check that migrations completed successfully
- Look for error messages in SQL Editor

## Row Level Security (RLS)

If you have RLS enabled, you may need to add policies:

```sql
-- Allow admins to manage their institution's data
CREATE POLICY "Admins can manage departments"
ON departments
FOR ALL
USING (
  institution_id IN (
    SELECT institution_id 
    FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Similar policies for users table
CREATE POLICY "Admins can manage users"
ON users
FOR ALL
USING (
  institution_id IN (
    SELECT institution_id 
    FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);
```

## Environment Variables

Make sure your backend `.env` has the correct Supabase credentials:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
```

## Next Steps

1. ✅ Run all migrations in Supabase SQL Editor
2. ✅ Verify tables and columns exist
3. ✅ Test institution onboarding flow
4. ✅ Test admin login and dashboard access
5. ✅ Create departments and users

## Support

If you encounter issues:
1. Check the Supabase logs (Logs section in dashboard)
2. Verify all migrations ran successfully
3. Check browser console for frontend errors
4. Check backend logs for API errors
