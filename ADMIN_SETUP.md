# Institution Admin Dashboard Setup Guide

## Overview

The Studi+ platform now has two separate admin dashboards:

1. **Institution Admin Dashboard** (`/admin/dashboard`) - For institution administrators who manage their own institution
2. **Super Admin Dashboard** (`/superadmin`) - For Studi+ platform administrators who monitor all institutions

## Database Migrations

Run these migrations in order to set up the required database schema:

```bash
# 1. Multi-tenant schema (institutions, demo requests)
psql -d your_database -f backend/migrations/multi_tenant_schema.sql

# 2. Add admin role to users
psql -d your_database -f backend/migrations/add_admin_role.sql

# 3. Update institutions table for onboarding
psql -d your_database -f backend/migrations/update_institutions_onboarding.sql

# 4. Create departments schema
psql -d your_database -f backend/migrations/departments_schema.sql

# 5. Add user detail columns (faculty_role, roll_no, year)
psql -d your_database -f backend/migrations/add_user_details_columns.sql
```

## Testing the Complete Flow

### 1. Institution Onboarding

1. Navigate to `/institution-onboarding`
2. Fill in institution details:
   - Institution Name: "Test University"
   - 6-character code: "testun"
   - Admin Name: "Admin User"
   - Admin Email: "admin@test.edu"
   - Admin Password: "password123"
   - Phone, Address, Student Count (optional)
3. Select a package (Basic/Premium/Enterprise)
4. Choose billing cycle (Monthly/Yearly)
5. Complete mock payment
6. Note the institution code displayed on success screen

### 2. Login as Institution Admin

1. Navigate to `/institution-select`
2. Enter the institution code: "testun"
3. Click Continue
4. Login with admin credentials:
   - Email: admin@test.edu
   - Password: password123
5. You should be redirected to `/admin/dashboard`

### 3. Institution Admin Dashboard Features

#### Department Management
- Create departments with name, code, and description
- Edit existing departments
- Delete departments (with confirmation)

#### User Management
- View all students and teachers
- Filter by role (All/Students/Teachers)
- Create new users:
  - **Students**: Name, Email, Password, Department, Roll Number, Year
  - **Teachers**: Name, Email, Password, Department, Faculty Role
- Edit existing users
- Delete users (cannot delete self)

#### Faculty Roles Available
- HOD (Head of Department)
- Academic Head
- DC (Discipline Committee)
- Professor
- Assistant Professor
- Associate Professor

### 4. Super Admin Dashboard

The Super Admin dashboard is for Studi+ platform administrators (no institution_id).

**Access**: Navigate to `/superadmin`

**Features**:
- View all institutions
- Monitor demo requests
- Delete institutions (cascade deletes all related data)
- Delete demo requests
- Update institution status and plans

**Note**: Currently, there's no separate super admin creation flow. You'll need to manually create a super admin user in the database with `role='admin'` and `institution_id=NULL`.

## API Endpoints

### Institution Admin Routes (`/api/admin/*`)

All routes require authentication and admin role.

#### Departments
- `GET /api/admin/departments` - Get all departments
- `POST /api/admin/departments` - Create department
- `PUT /api/admin/departments/:id` - Update department
- `DELETE /api/admin/departments/:id` - Delete department

#### Users
- `GET /api/admin/users` - Get all users (with department names)
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user

### Institution Routes (`/api/institutions/*`)

- `GET /api/institutions/verify/:subdomain` - Verify institution exists
- `POST /api/institutions/onboard` - Onboard new institution
- `POST /api/institutions/check-code` - Check if code is available
- `GET /api/institutions` - Get all institutions (admin only)
- `DELETE /api/institutions/:id` - Delete institution (cascade)

## Authentication Flow

### Institution Admin
1. User onboards institution → Creates institution + admin user with `institution_id`
2. Admin logs in → Backend returns user with `role='admin'` and `institution_id`
3. Frontend checks: `user.role === 'admin' && user.institution_id` → Redirect to `/admin/dashboard`

### Super Admin
1. Super admin user exists in database with `role='admin'` and `institution_id=NULL`
2. Super admin logs in → Backend returns user with `role='admin'` and no `institution_id`
3. Frontend checks: `user.role === 'admin' && !user.institution_id` → Redirect to `/superadmin`

### Regular Users
1. Students/Teachers log in → Backend returns user with `role='student'` or `role='teacher'`
2. Frontend redirects to `/dashboard` or `/teacher` based on role

## Troubleshooting

### "new row for relation users violates check constraint users_role_check"
- Run the `add_admin_role.sql` migration to add 'admin' to the allowed roles

### "column faculty_role does not exist"
- Run the `add_user_details_columns.sql` migration

### "relation departments does not exist"
- Run the `departments_schema.sql` migration

### Admin redirected to regular dashboard
- Check that the user has `role='admin'` in the database
- For institution admin, ensure `institution_id` is set
- For super admin, ensure `institution_id` is NULL

### Cannot create departments/users
- Verify the admin routes are registered in `backend/index.js`
- Check that authentication middleware is working
- Ensure the user has admin role

## Next Steps

1. **Test the complete flow**: Onboard → Login → Create departments → Create users
2. **Verify department dropdown**: After creating departments, check if they appear in student/teacher registration
3. **Super admin access**: Create a super admin user manually or implement a separate super admin creation flow
4. **Email notifications**: Verify welcome emails are sent after onboarding
5. **Data isolation**: Test that institution admins can only see/manage their own institution's data
