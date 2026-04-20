# ✅ Institution Admin Dashboard - Implementation Checklist

## Database Setup

- [ ] Opened Supabase SQL Editor
- [ ] Ran `SUPABASE_RUN_THIS.sql` migration
- [ ] Verified success messages appeared
- [ ] Checked that users table has these columns:
  - [ ] `faculty_role`
  - [ ] `roll_no`
  - [ ] `year`
  - [ ] `department_id`
  - [ ] `institution_id`
- [ ] Checked that institutions table has these columns:
  - [ ] `contact_name`
  - [ ] `phone`
  - [ ] `address`
  - [ ] `student_count`
  - [ ] `billing_cycle`
- [ ] Verified departments table exists

## Backend Setup

- [ ] Backend server is running (`npm start` or `node index.js`)
- [ ] No errors in backend console
- [ ] Admin routes registered in `backend/index.js`
- [ ] Environment variables configured:
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_KEY`

## Frontend Setup

- [ ] Frontend dev server is running (`npm run dev`)
- [ ] No errors in browser console
- [ ] Can access landing page: `http://localhost:5173/`

## Institution Onboarding Flow

- [ ] Navigate to `/institution-onboarding`
- [ ] Form displays correctly with all fields
- [ ] Can enter institution details
- [ ] 6-character code validation works
- [ ] Package selection (Basic/Premium/Enterprise) works
- [ ] Billing cycle toggle (Monthly/Yearly) works
- [ ] Mock payment screen displays
- [ ] Success screen shows institution code
- [ ] Institution created in Supabase `institutions` table
- [ ] Admin user created in Supabase `users` table with:
  - [ ] `role = 'admin'`
  - [ ] `institution_id` set correctly

## Institution Select & Login Flow

- [ ] Navigate to `/institution-select`
- [ ] Can enter 6-character institution code
- [ ] Redirects to login page after entering code
- [ ] Institution name badge shows in top right
- [ ] "Change institution" button works
- [ ] Can login with admin credentials
- [ ] Redirects to `/admin/dashboard` (not `/dashboard`)

## Institution Admin Dashboard

### Navigation & Layout
- [ ] Dashboard loads without errors
- [ ] Header shows "Institution Admin"
- [ ] User name and email displayed
- [ ] Logout button works
- [ ] Three tabs visible: Departments, Users, Settings

### Stats Cards
- [ ] Total Students card displays
- [ ] Total Teachers card displays
- [ ] Departments card displays
- [ ] Active Groups card displays
- [ ] Numbers update when data changes

### Departments Tab
- [ ] "Departments" tab is active by default
- [ ] "+ Add Department" button visible
- [ ] Can click to open department modal
- [ ] Modal has fields: Name, Code, Description
- [ ] Can create new department
- [ ] Department appears in grid after creation
- [ ] Can edit existing department
- [ ] Can delete department (with confirmation)
- [ ] Empty state shows when no departments

### Users Tab
- [ ] Can switch to "Users" tab
- [ ] Filter buttons work (All/Students/Teachers)
- [ ] "+ Add User" button visible
- [ ] Can click to open user modal
- [ ] Modal has all required fields:
  - [ ] Name, Email, Password
  - [ ] Role dropdown (Student/Teacher)
  - [ ] Department dropdown (populated from created departments)
  - [ ] Faculty Role dropdown (for teachers only)
  - [ ] Roll Number field (for students only)
  - [ ] Year dropdown (for students only)
- [ ] Can create student with all details
- [ ] Can create teacher with faculty role
- [ ] Users appear in table after creation
- [ ] Department name displays correctly in table
- [ ] Faculty role displays for teachers
- [ ] Can edit existing user
- [ ] Can delete user (with confirmation)
- [ ] Cannot delete own account
- [ ] Empty state shows when no users

### Settings Tab
- [ ] Can switch to "Settings" tab
- [ ] "Settings coming soon..." message displays

## User Management Features

### Student Creation
- [ ] Can create student with:
  - [ ] Name
  - [ ] Email (unique)
  - [ ] Password (min 8 chars)
  - [ ] Department selection
  - [ ] Roll number
  - [ ] Year (1-4)
- [ ] Student appears in users list
- [ ] Student can login and access `/dashboard`

### Teacher Creation
- [ ] Can create teacher with:
  - [ ] Name
  - [ ] Email (unique)
  - [ ] Password (min 8 chars)
  - [ ] Department selection
  - [ ] Faculty role (HOD, Academic Head, DC, Professor, etc.)
- [ ] Teacher appears in users list
- [ ] Teacher can login and access `/teacher` dashboard

## Department Management

- [ ] Can create department with name and code
- [ ] Department code is unique per institution
- [ ] Can add optional description
- [ ] Departments appear in user creation dropdown
- [ ] Can edit department details
- [ ] Can delete department
- [ ] Deleting department doesn't break users (sets to null)

## Authentication & Authorization

- [ ] Admin can only see their own institution's data
- [ ] Admin cannot access other institutions' data
- [ ] Regular users cannot access admin dashboard
- [ ] Students redirect to `/dashboard`
- [ ] Teachers redirect to `/teacher`
- [ ] Institution admin redirects to `/admin/dashboard`
- [ ] Super admin (if created) redirects to `/superadmin`

## API Endpoints

### Admin Routes (`/api/admin/*`)
- [ ] `GET /api/admin/departments` - Returns departments
- [ ] `POST /api/admin/departments` - Creates department
- [ ] `PUT /api/admin/departments/:id` - Updates department
- [ ] `DELETE /api/admin/departments/:id` - Deletes department
- [ ] `GET /api/admin/users` - Returns users with department names
- [ ] `POST /api/admin/users` - Creates user
- [ ] `PUT /api/admin/users/:id` - Updates user
- [ ] `DELETE /api/admin/users/:id` - Deletes user

### Institution Routes (`/api/institutions/*`)
- [ ] `GET /api/institutions/verify/:subdomain` - Verifies institution
- [ ] `POST /api/institutions/check-code` - Checks code availability
- [ ] `POST /api/institutions/onboard` - Onboards institution

## Error Handling

- [ ] Duplicate email shows error message
- [ ] Invalid institution code shows error
- [ ] Missing required fields show validation errors
- [ ] Network errors display user-friendly messages
- [ ] 403 errors redirect to appropriate page
- [ ] 401 errors redirect to login

## Data Validation

- [ ] Institution code must be exactly 6 characters
- [ ] Email must be valid format
- [ ] Password must be at least 8 characters
- [ ] Cannot create duplicate emails
- [ ] Cannot create duplicate institution codes
- [ ] Department code is required
- [ ] User role must be student or teacher

## Browser Testing

- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Works in Edge
- [ ] Responsive on mobile devices
- [ ] No console errors
- [ ] No console warnings

## Performance

- [ ] Dashboard loads quickly (<2 seconds)
- [ ] Department list loads quickly
- [ ] User list loads quickly
- [ ] Modals open/close smoothly
- [ ] No lag when typing in forms
- [ ] API responses are fast (<500ms)

## Documentation

- [ ] Read `QUICK_START.md`
- [ ] Read `SUPABASE_SETUP.md`
- [ ] Read `ADMIN_SETUP.md`
- [ ] Understand the architecture
- [ ] Know how to run migrations
- [ ] Know how to test the flow

## Optional: Super Admin

- [ ] Created super admin user manually in Supabase
- [ ] Super admin has `role='admin'` and `institution_id=NULL`
- [ ] Super admin can access `/superadmin`
- [ ] Super admin can view all institutions
- [ ] Super admin can delete institutions
- [ ] Super admin can manage demo requests

## Final Verification

- [ ] Complete onboarding flow works end-to-end
- [ ] Admin can create departments
- [ ] Admin can create students and teachers
- [ ] Students can login and use platform
- [ ] Teachers can login and use platform
- [ ] Data is properly isolated per institution
- [ ] No security vulnerabilities
- [ ] All features work as expected

---

## If Any Item Fails

1. Check browser console for errors
2. Check backend logs for errors
3. Verify migration ran successfully in Supabase
4. Check that all environment variables are set
5. Restart backend and frontend servers
6. Clear browser cache and localStorage
7. Check the troubleshooting sections in documentation

## Success Criteria

✅ All checkboxes above are checked
✅ No errors in console
✅ Can complete full flow without issues
✅ Data persists correctly in Supabase
✅ Users can login and access appropriate dashboards

---

**Status**: [ ] Not Started | [ ] In Progress | [ ] Complete

**Notes**:
