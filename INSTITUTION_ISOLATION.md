# Institution-Level Data Isolation

## Overview
This document describes the multi-tenant security implementation that ensures users from one institution cannot access data from another institution.

## Security Measures Implemented

### 1. JWT Token Enhancement
- JWT tokens now include `institutionId` in addition to `id` and `role`
- This is set during login/registration and verified on every authenticated request
- Location: `backend/middleware/auth.js`

### 2. Groups Isolation

#### Database Changes
- Added `institution_id` column to `groups` table
- Created indexes for performance: `idx_groups_institution_id` and `idx_groups_institution_invite`
- Migration file: `backend/migrations/add_institution_to_groups.sql`

#### API Changes (`backend/routes/groups.js`)
- **Create Group**: Automatically sets `institution_id` from `req.user.institutionId`
- **Join Group**: Filters by both `invite_code` AND `institution_id` - even if the code matches, users can only join groups in their institution
- **List Groups**: Implicitly filtered by membership, which is institution-scoped

### 3. Student Manager Isolation (`backend/routes/teacher.js`)
- **List Students**: Added `.eq('institution_id', req.user.institutionId)` filter
- **Get Student Profile**: Added `.eq('institution_id', req.user.institutionId)` filter
- Teachers can only view and manage students from their own institution

### 4. Direct Messages Isolation (`backend/routes/dm.js`)
- **Search Users**: Added `.eq('institution_id', req.user.institutionId)` filter - users can only search for people in their institution
- **Create Conversation**: Validates that target user is in the same institution before allowing DM creation
- **Existing Conversations**: Automatically isolated since both participants must be from same institution

### 5. User Profile Access (`backend/routes/users.js`)
- **Get User by ID**: Added `.eq('institution_id', req.user.institutionId)` filter
- Users can only view profiles of users from their own institution

### 6. Files Isolation (`backend/routes/files.js`)
- Files are scoped to groups
- Since groups are institution-isolated, files are automatically institution-isolated
- No additional changes needed

### 7. Messages Isolation (`backend/routes/messages.js`)
- Messages are scoped to groups
- Since groups are institution-isolated, messages are automatically institution-isolated
- No additional changes needed

## What This Prevents

### ❌ Cross-Institution Access Blocked
1. **Group Joining**: Even if a user knows a group invite code from another institution, they cannot join it
2. **Student Data**: Teachers cannot view student profiles, grades, or achievements from other institutions
3. **Direct Messages**: Users cannot search for or message users from other institutions
4. **User Profiles**: Users cannot access profile information of users from other institutions
5. **Files & Documents**: Users cannot access files uploaded to groups in other institutions

### ✅ Within-Institution Access Allowed
1. Students and teachers can freely interact within their own institution
2. Group codes work normally within the same institution
3. Direct messages work between any users in the same institution
4. Teachers can view all students in their institution

## Testing Checklist

To verify institution isolation is working:

1. **Create two test institutions** with different users
2. **Test Group Joining**:
   - Create a group in Institution A
   - Try to join with the invite code from Institution B user
   - Should fail with "Invalid invite code or group not found in your institution"

3. **Test Student Manager**:
   - Login as teacher in Institution A
   - Try to access student profile from Institution B (if you know the ID)
   - Should return "Student not found"

4. **Test Direct Messages**:
   - Login as user in Institution A
   - Search for user email from Institution B
   - Should return no results

5. **Test User Profiles**:
   - Login as user in Institution A
   - Try to access `/api/users/:id` with ID from Institution B
   - Should return "User not found"

## Database Migration

Run the migration to add institution isolation to groups:

```bash
# Apply the migration to your Supabase database
psql $DATABASE_URL -f backend/migrations/add_institution_to_groups.sql
```

Or run it directly in Supabase SQL Editor:
```sql
-- Copy contents of backend/migrations/add_institution_to_groups.sql
```

## Security Notes

1. **Defense in Depth**: Multiple layers of protection ensure data isolation
2. **JWT-Based**: Institution ID is cryptographically signed in the JWT token
3. **Database-Level**: RLS policies provide additional protection at the database level
4. **API-Level**: Every route explicitly filters by institution_id
5. **No Leakage**: Error messages don't reveal existence of data in other institutions

## Future Enhancements

Consider implementing:
1. **Audit Logging**: Log all cross-institution access attempts
2. **Rate Limiting**: Per-institution rate limits
3. **Admin Override**: Super admin ability to view across institutions (with logging)
4. **Institution Switching**: Allow users to belong to multiple institutions (if needed)
