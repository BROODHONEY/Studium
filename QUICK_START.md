# 🚀 Quick Start Guide - Institution Admin Dashboard

## Step 1: Run Migration in Supabase (2 minutes)

1. Open your Supabase dashboard: https://app.supabase.com
2. Select your project
3. Click **SQL Editor** (left sidebar)
4. Click **+ New query**
5. Copy everything from `backend/migrations/SUPABASE_RUN_THIS.sql`
6. Paste and click **Run**
7. ✅ Done! You should see success messages

## Step 2: Test the Flow (5 minutes)

### A. Onboard a New Institution

1. Start your frontend: `npm run dev` (in frontend folder)
2. Go to: http://localhost:5173/institution-onboarding
3. Fill in the form:
   ```
   Institution Name: Test University
   Code: testun (6 characters)
   Admin Name: Admin User
   Admin Email: admin@test.edu
   Admin Password: password123
   ```
4. Select a package (Premium recommended)
5. Choose billing cycle (Monthly/Yearly)
6. Complete mock payment
7. ✅ Note the institution code shown on success

### B. Login as Institution Admin

1. Go to: http://localhost:5173/institution-select
2. Enter code: `testun`
3. Click Continue
4. Login with:
   ```
   Email: admin@test.edu
   Password: password123
   ```
5. ✅ You should be redirected to `/admin/dashboard`

### C. Create Departments

1. In the admin dashboard, you're on the "Departments" tab
2. Click **+ Add Department**
3. Fill in:
   ```
   Name: Computer Science
   Code: CS
   Description: Department of Computer Science
   ```
4. Click Save
5. ✅ Department created!

### D. Create Users

1. Click the "Users" tab
2. Click **+ Add User**
3. For a student:
   ```
   Name: John Doe
   Email: john@test.edu
   Password: student123
   Role: Student
   Department: Computer Science
   Roll Number: CS2024001
   Year: 2
   ```
4. For a teacher:
   ```
   Name: Jane Smith
   Email: jane@test.edu
   Password: teacher123
   Role: Teacher
   Department: Computer Science
   Faculty Role: Professor
   ```
5. ✅ Users created!

## Step 3: Verify Everything Works

### Check the Dashboard Stats
- Total Students: Should show 1
- Total Teachers: Should show 1
- Departments: Should show 1
- Active Groups: 0 (normal)

### Test User Login
1. Logout from admin account
2. Go to institution select, enter `testun`
3. Login as student: `john@test.edu` / `student123`
4. Should redirect to regular dashboard
5. ✅ Student login works!

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Studi+ Platform                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────┐         ┌──────────────────┐     │
│  │  Super Admin     │         │ Institution Admin│     │
│  │  (Studi+ Team)   │         │  (University)    │     │
│  │                  │         │                  │     │
│  │  /superadmin     │         │  /admin/dashboard│     │
│  │                  │         │                  │     │
│  │  - All Insts     │         │  - Departments   │     │
│  │  - Demo Requests │         │  - Users         │     │
│  │  - Delete Insts  │         │  - Settings      │     │
│  └──────────────────┘         └──────────────────┘     │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Regular Users (Students/Teachers)        │  │
│  │                                                  │  │
│  │  /dashboard  -  Groups, Messages, Dues, Files   │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Key Features

### Institution Admin Can:
- ✅ Create and manage departments
- ✅ Create students and teachers
- ✅ Assign faculty roles (HOD, Professor, etc.)
- ✅ Set student details (roll number, year)
- ✅ View institution statistics
- ✅ Edit and delete users/departments

### Super Admin Can:
- ✅ View all institutions
- ✅ Monitor demo requests
- ✅ Delete institutions (cascade)
- ✅ Update institution status/plans

### Students/Teachers Can:
- ✅ Join groups
- ✅ Send messages
- ✅ Share files
- ✅ Manage dues
- ✅ Take quizzes

## Troubleshooting

### "violates check constraint users_role_check"
→ Run the migration again, it adds 'admin' to allowed roles

### "column faculty_role does not exist"
→ Run the migration, it adds this column

### Admin redirected to regular dashboard
→ Check user has `role='admin'` in Supabase users table

### Cannot create departments
→ Verify you're logged in as admin
→ Check browser console for errors

### Department dropdown empty in registration
→ Create departments first in admin dashboard
→ Refresh the registration page

## Need Help?

1. Check `SUPABASE_SETUP.md` for detailed Supabase instructions
2. Check `ADMIN_SETUP.md` for complete API documentation
3. Run `node backend/tests/test-admin-flow.js` for automated testing
4. Check browser console and backend logs for errors

## What's Next?

- [ ] Create more departments
- [ ] Add more students and teachers
- [ ] Test student/teacher login
- [ ] Create groups and test messaging
- [ ] Set up super admin access
- [ ] Configure email notifications
- [ ] Customize institution branding
