# Fix: Institution ID Undefined Error

## Problem
Error: `invalid input syntax for type uuid: "undefined"`

This occurs because the JWT token uses `institutionId` (camelCase) but the backend code expects `institution_id` (snake_case).

## Solution Applied

### 1. Updated Auth Middleware
**File:** `backend/middleware/auth.js`

The middleware now normalizes the user object to use snake_case:

```javascript
req.user = {
  id: decoded.id,
  role: decoded.role,
  institution_id: decoded.institutionId || decoded.institution_id,
  email: decoded.email
};
```

This ensures compatibility with both naming conventions.

### 2. Added Validation
**File:** `backend/routes/reportTemplates.js`

Added checks to ensure `institution_id` exists before querying:

```javascript
if (!req.user.institution_id) {
  return res.status(400).json({ 
    error: 'Your account is not associated with an institution.' 
  });
}
```

### 3. Better Error Handling
- Changed `.single()` to `.maybeSingle()` to handle cases where no template exists
- Added specific error codes for different failure scenarios
- Improved logging for debugging

## Testing the Fix

### Step 1: Restart Backend Server
```bash
# Stop the server (Ctrl+C)
cd backend
npm start
```

### Step 2: Clear Browser Cache
- Open DevTools (F12)
- Go to Application tab
- Clear Storage → Clear site data
- Or just do a hard refresh (Ctrl+Shift+R)

### Step 3: Login Again
Your new JWT token will now include the properly formatted institution_id.

### Step 4: Test Template Save
1. Go to Admin Dashboard → Report Templates
2. Fill in college name
3. Click "Save Template"
4. Should see success message ✅

## Verify Your Institution ID

To check if your user has an institution_id, run this in Supabase SQL Editor:

```sql
SELECT id, email, role, institution_id 
FROM users 
WHERE role = 'admin';
```

If `institution_id` is NULL, you need to assign one:

```sql
-- First, check available institutions
SELECT * FROM institutions;

-- Then update your user
UPDATE users 
SET institution_id = 'YOUR_INSTITUTION_UUID_HERE'
WHERE email = 'your-admin-email@example.com';
```

## If You Don't Have an Institution

Create one first:

```sql
INSERT INTO institutions (name, domain, status)
VALUES ('Your College Name', 'yourcollege.edu', 'active')
RETURNING id;

-- Use the returned ID to update your user
UPDATE users 
SET institution_id = 'THE_ID_FROM_ABOVE'
WHERE email = 'your-admin-email@example.com';
```

## Expected Behavior After Fix

✅ No more "undefined" UUID errors
✅ Template saves successfully
✅ Template loads on page refresh
✅ Logo upload works
✅ All settings persist

## Troubleshooting

### Still Getting "undefined" Error?

1. **Check your JWT token:**
   - Open DevTools → Application → Local Storage
   - Find the `token` key
   - Copy the value
   - Go to [jwt.io](https://jwt.io)
   - Paste the token
   - Check if `institutionId` is present in the payload

2. **If institutionId is missing from token:**
   - Logout and login again
   - This will generate a new token with the correct data

3. **If institutionId is still missing:**
   - Check the login route in `backend/routes/auth.js`
   - Ensure it's including `institutionId` in the JWT payload
   - Verify your user has an `institution_id` in the database

### Error: "Your account is not associated with an institution"

This means your user record doesn't have an `institution_id`. Follow the SQL commands above to assign one.

## Files Modified

1. ✅ `backend/middleware/auth.js` - Normalize user object
2. ✅ `backend/routes/reportTemplates.js` - Add validation and better errors
3. ✅ Error messages now show helpful guidance

## Success Checklist

- [ ] Backend server restarted
- [ ] Logged out and logged back in
- [ ] Template saves without errors
- [ ] Success message appears
- [ ] Settings persist after refresh
