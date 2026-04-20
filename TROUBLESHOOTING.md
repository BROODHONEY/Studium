# Troubleshooting Guide

## Error: "Failed to verify code" with ERR_CONNECTION_REFUSED

### Problem
The frontend cannot connect to the backend API at `http://localhost:3000`

### Solution

1. **Start the Backend Server**
   ```bash
   cd backend
   npm start
   # or
   node index.js
   ```

2. **Verify Backend is Running**
   - You should see: `Server running on port 3000`
   - Open browser and go to: `http://localhost:3000`
   - You should see: `{"message":"Studi+ API is running"}`

3. **Check Environment Variables**
   
   Make sure `backend/.env` has:
   ```env
   PORT=3000
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_KEY=your-service-role-key
   FRONTEND_URL=http://localhost:5173
   ```

4. **Check Frontend Environment Variables**
   
   Make sure `frontend/.env` has:
   ```env
   VITE_API_URL=http://localhost:3000/api
   ```

5. **Restart Both Servers**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm start

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

## Error: "Code already taken"

### Problem
The institution code you're trying to use already exists in the database.

### Solution
1. Choose a different 6-character code
2. Or delete the existing institution from Supabase:
   ```sql
   -- In Supabase SQL Editor
   DELETE FROM institutions WHERE subdomain = 'testin';
   ```

## Error: "violates check constraint users_role_check"

### Problem
The database doesn't allow 'admin' role yet.

### Solution
Run the migration in Supabase SQL Editor:
```sql
-- Drop existing constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new constraint with admin role
ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('student', 'teacher', 'admin'));
```

## Error: "column faculty_role does not exist"

### Problem
The database is missing the new columns.

### Solution
Run the complete migration in Supabase SQL Editor:
Copy and paste the entire content of `backend/migrations/SUPABASE_RUN_THIS.sql`

## Backend Not Starting

### Check for Port Conflicts
```bash
# Windows
netstat -ano | findstr :3000

# If port is in use, kill the process or use a different port
```

### Check for Missing Dependencies
```bash
cd backend
npm install
```

### Check for Syntax Errors
```bash
cd backend
node index.js
# Look for any error messages
```

## Frontend Not Starting

### Check for Missing Dependencies
```bash
cd frontend
npm install
```

### Check for Port Conflicts
```bash
# If port 5173 is in use, Vite will automatically use 5174
```

## Database Connection Issues

### Verify Supabase Credentials
1. Go to Supabase Dashboard
2. Click Settings → API
3. Copy the correct values:
   - Project URL → `SUPABASE_URL`
   - anon/public key → `SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_KEY`

### Test Database Connection
Run this in Supabase SQL Editor:
```sql
SELECT * FROM institutions LIMIT 1;
```

If you get an error, check that the migrations ran successfully.

## CORS Errors

### Problem
Browser shows CORS policy errors.

### Solution
1. Make sure backend `.env` has:
   ```env
   FRONTEND_URL=http://localhost:5173
   ```

2. Restart the backend server

3. Clear browser cache and reload

## Login Redirects to Wrong Page

### Problem
Admin user redirects to `/dashboard` instead of `/admin/dashboard`

### Solution
Check the user in Supabase:
```sql
SELECT id, name, email, role, institution_id 
FROM users 
WHERE email = 'admin@test.edu';
```

Make sure:
- `role = 'admin'`
- `institution_id` is set (not NULL)

## Cannot Create Departments

### Problem
Getting 403 or 500 errors when creating departments.

### Solution
1. Verify you're logged in as admin
2. Check browser console for errors
3. Check backend logs for errors
4. Verify the departments table exists:
   ```sql
   SELECT * FROM departments LIMIT 1;
   ```

## Socket Connection Errors

### Problem
Multiple socket connection errors in console.

### Solution
These are usually harmless if the main functionality works. To fix:

1. Make sure backend is running
2. Check that socket.io is properly configured
3. Ignore if everything else works (socket is for real-time features)

## Quick Diagnostic Checklist

Run through this checklist:

- [ ] Backend server is running (`http://localhost:3000` shows API message)
- [ ] Frontend server is running (`http://localhost:5173` loads)
- [ ] Supabase migration ran successfully
- [ ] Environment variables are set correctly
- [ ] No errors in backend console
- [ ] No errors in browser console (except socket warnings)
- [ ] Can access landing page
- [ ] Can access onboarding page

## Still Having Issues?

1. **Check Backend Logs**
   - Look at the terminal where backend is running
   - Any errors will show there

2. **Check Browser Console**
   - Press F12 in browser
   - Look at Console tab
   - Look at Network tab for failed requests

3. **Check Supabase Logs**
   - Go to Supabase Dashboard
   - Click Logs in sidebar
   - Look for any errors

4. **Restart Everything**
   ```bash
   # Stop all servers (Ctrl+C)
   
   # Backend
   cd backend
   npm install
   npm start
   
   # Frontend (new terminal)
   cd frontend
   npm install
   npm run dev
   ```

5. **Clear Everything and Start Fresh**
   ```bash
   # Clear browser cache
   # Clear localStorage (F12 → Application → Local Storage → Clear)
   
   # Delete node_modules and reinstall
   cd backend
   rm -rf node_modules
   npm install
   
   cd ../frontend
   rm -rf node_modules
   npm install
   ```
