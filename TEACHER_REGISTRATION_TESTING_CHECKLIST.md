# Teacher Registration System - Testing Checklist

## ✅ BACKEND VERIFICATION

### 1. Environment Variables
- [ ] `RESEND_API_KEY` configured in .env
- [ ] `RESEND_FROM_EMAIL` configured (e.g., admin@school.com)
- [ ] `FRONTEND_ORIGIN` configured (e.g., http://localhost:5173)
- [ ] `REGISTRATION_CODE_SECRET` configured (defaults if not set)

### 2. Database Collections
- [ ] `registrationCodes` collection exists
- [ ] `users` collection has `subjectIds` and `formClassId` fields
- [ ] Sample subjects exist in `subjects` collection
- [ ] Sample form classes exist in `classes` collection

### 3. Required Modules Installed
```bash
cd backend
npm install
# Should have: bcryptjs, dotenv, axios (for Resend)
```

### 4. Backend Server Running
```bash
npm start
# Check console output:
# - Server running on port 3000 (or configured port)
# - No errors loading registrationCodeUtils.js
# - No errors loading repos/registrationCodes.js
```

### 5. Test Admin Registration Code Endpoint
**Endpoint**: `POST /api/admin/registration-codes`

**Test with Postman or cURL**:
```bash
curl -X POST http://localhost:3000/api/admin/registration-codes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "displayName": "John Doe",
    "email": "john@school.com",
    "subjectIds": ["mathematics", "physics"],
    "formClassId": "jss-1a",
    "expiryDays": 7
  }'
```

**Expected Result**:
- [ ] Status 200 OK
- [ ] Response contains code in format tch-2026-NNN (e.g., tch-2026-001)
- [ ] Response shows subject count (2)
- [ ] Response shows formClassAssigned: true

### 6. Test Send Code Email Endpoint
**Endpoint**: `POST /api/admin/registration-codes/:code/send`

```bash
curl -X POST http://localhost:3000/api/admin/registration-codes/ABCD-EFGH-IJKL/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "recipientEmail": "john@school.com"
  }'
```

**Expected Result**:
- [ ] Status 200 OK
- [ ] Message indicates email sent
- [ ] Check email backend logs for Resend API call

### 7. Test List Registration Codes Endpoint
**Endpoint**: `GET /api/admin/registration-codes?status=ACTIVE`

```bash
curl -X GET "http://localhost:3000/api/admin/registration-codes?status=ACTIVE" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Expected Result**:
- [ ] Status 200 OK
- [ ] Returns array of codes
- [ ] Code from Step 5 appears in list with status ACTIVE

### 8. Test Teacher Registration Endpoint
**Endpoint**: `POST /api/auth/register/teacher`

```bash
curl -X POST http://localhost:3000/api/auth/register/teacher \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@school.com",
    "password": "TestPass123",
    "displayName": "John Doe",
    "registrationCode": "ABCD-EFGH-IJKL"
  }'
```

**Expected Result**:
- [ ] Status 200 OK
- [ ] Response contains `success: true`
- [ ] Response contains generated username (tch-2026-NNN)
- [ ] Response shows subjectsAssigned: 2
- [ ] Response shows formClassAssigned: true

### 9. Verify User Created in Database
**Check**:
- [ ] User exists in `users` collection
- [ ] `username` field is `tch-2026-001` or similar
- [ ] `subjectIds` array contains both subject IDs
- [ ] `formClassId` is `jss-1a`
- [ ] `portal` is `TEACHER`
- [ ] `role` is `TEACHER`

### 10. Verify Code Marked as Used
**Check via endpoint**:
```bash
curl -X GET http://localhost:3000/api/admin/registration-codes/ABCD-EFGH-IJKL \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Expected**:
- [ ] `status` is `USED`
- [ ] `used` is `true`
- [ ] `usedBy` contains the generated username
- [ ] `usedAt` shows timestamp

### 11. Test Code Reuse Prevention
**Try registering again with same code**:
```bash
curl -X POST http://localhost:3000/api/auth/register/teacher \
  -H "Content-Type: application/json" \
  -d '{
    "email": "another@school.com",
    "password": "TestPass456",
    "displayName": "Another Teacher",
    "registrationCode": "ABCD-EFGH-IJKL"
  }'
```

**Expected**:
- [ ] Status 400 Bad Request
- [ ] Error code is `INVALID_CODE`
- [ ] Error message explains code is invalid/used

---

## ✅ FRONTEND VERIFICATION

### 1. Environment Variables
- [ ] `VITE_API_URL` configured (or defaults to localhost:4000)
- [ ] Frontend can reach backend API

### 2. Check Component Files Exist
```bash
cd frontend-vue
ls src/components/TeacherRegistrationForm.vue
```

**Expected**:
- [ ] File exists
- [ ] No syntax errors (check VS Code problems panel)

### 3. Check Router Configuration
```bash
grep -n "teacher-registration" src/router/index.ts
```

**Expected**:
- [ ] Route `/register/teacher` configured
- [ ] Component imported correctly
- [ ] No import errors

### 4. Frontend Development Server
```bash
npm run dev
# Should start on http://localhost:5173
```

**Expected**:
- [ ] Server starts successfully
- [ ] No build errors
- [ ] Console shows no errors

### 5. Visit Registration Page
**Navigate to**: `http://localhost:5173/#/register/teacher`

**Visual Verification**:
- [ ] Page loads without errors
- [ ] Form has 4 input fields
- [ ] Fields are: Email, Full Name, Password, Registration Code
- [ ] Proper styling/colors visible
- [ ] "Create Account" button visible

### 6. Test Form Validation - Email Field
**Action**: Leave email blank, click elsewhere
**Expected**:
- [ ] Error message: "Email is required"
- [ ] Submit button disabled

**Action**: Enter invalid email (e.g., "notanemail")
**Expected**:
- [ ] Error message: "Please enter a valid email address"
- [ ] Submit button disabled

### 7. Test Form Validation - Display Name Field
**Action**: Leave name blank, click elsewhere
**Expected**:
- [ ] Error message: "Full name is required"

**Action**: Enter single character
**Expected**:
- [ ] Error message: "Name must be at least 2 characters"

### 8. Test Form Validation - Password Field
**Action**: Leave password blank, click elsewhere
**Expected**:
- [ ] Error message: "Password is required"

**Action**: Enter 5 characters
**Expected**:
- [ ] Error message: "Password must be at least 6 characters"

**Action**: Enter valid password
**Expected**:
- [ ] Error message disappears
- [ ] Hint: "Minimum 6 characters" shows

### 9. Test Password Visibility Toggle
**Action**: Click eye icon
**Expected**:
- [ ] Password field switches between text and password type
- [ ] Can see password text when toggled

### 10. Test Code Field Formatting
**Action**: Type "abcdefghijkl" (without dashes)
**Expected**:
- [ ] Auto-formats to "ABCD-EFGH-IJKL"
- [ ] Converts to uppercase
- [ ] Adds dashes at positions 4 and 8

**Action**: Type with dashes already "ABCD-EFGH-IJKL"
**Expected**:
- [ ] Accepts input correctly
- [ ] Field shows properly formatted code

### 11. Test Code Validation
**Action**: Enter code "abc-1234-ab" (wrong format)
**Expected**:
- [ ] Error message: "Code must be in format tch-2026-NNN (e.g., tch-2026-001)"
- [ ] Submit button disabled

### 12. Test Complete Registration Flow
**Fill form with**:
- Email: john@school.com
- Full Name: John Doe
- Password: TestPass123
- Registration Code: tch-2026-001

**Action**: Click "Create Account"

**Expected**:
- [ ] Button shows "Creating Account..." 
- [ ] Button is disabled
- [ ] No error appears
- [ ] Form submits successfully

### 13. Success Screen Verification
**After successful registration**:
- [ ] Shows success message
- [ ] Displays generated username (e.g., tch-2026-001)
- [ ] Shows email confirmation
- [ ] Shows "2 subject(s) assigned"
- [ ] Shows "Form class assigned"
- [ ] Copy button works for username
- [ ] Shows "Go to Login" button

### 14. Test Error Handling - Invalid Code
**Fill form with**:
- Email: test@school.com
- Full Name: Test Teacher
- Password: TestPass123
- Registration Code: XXXX-XXXX-XXXX

**Expected**:
- [ ] Error message: "The registration code is invalid or expired"
- [ ] Additional detail: "Please check the code and try again..."
- [ ] Form doesn't clear (can retry)
- [ ] Submit button re-enables

### 15. Test Error Handling - Email Mismatch
**If code was generated with specific email**:
- Try registering with different email
**Expected**:
- [ ] Error message: "Email does not match the registration code"

### 16. Test Error Handling - Email Already Registered
**After successful first registration**:
- Try registering second teacher with same email
**Expected**:
- [ ] Error message: "This email is already registered"

---

## ✅ END-TO-END INTEGRATION TEST

### Complete Registration Flow Test

**Scenario**: Admin creates code, sends to teacher, teacher registers

**Steps**:

1. **Admin generates code** (using backend admin endpoint)
   - [ ] Code generated successfully
   - [ ] Code format: tch-2026-NNN (e.g., tch-2026-001, tch-2026-042)
   - [ ] Subject count correct
   - [ ] Form class assigned

2. **Admin sends code email**
   - [ ] Email sent successfully
   - [ ] Check email body contains code
   - [ ] Check email contains subject count
   - [ ] Check email contains registration link

3. **Teacher visits registration page**
   - [ ] Page loads at /register/teacher
   - [ ] All form fields visible

4. **Teacher enters details**
   - [ ] Form validates all fields
   - [ ] Code auto-formats correctly
   - [ ] Can toggle password visibility

5. **Teacher submits form**
   - [ ] Registration succeeds
   - [ ] Username generated
   - [ ] Allocations displayed

6. **Verify in database**
   - [ ] User created with correct fields
   - [ ] Code marked as used
   - [ ] Subjects assigned
   - [ ] Form class assigned

7. **Verify teacher can login**
   - [ ] Go to login page
   - [ ] Enter generated username
   - [ ] Enter password
   - [ ] Login succeeds

8. **Verify teacher portal loads**
   - [ ] Dashboard shows teacher name
   - [ ] Shows assigned subjects
   - [ ] Shows form class
   - [ ] Can access score entry

---

## ✅ SECURITY VERIFICATION

### 1. Password Hashing
**Check**:
- [ ] Passwords are hashed (not stored as plaintext)
- [ ] Use bcryptjs (salt rounds >= 10)

**Database check**:
```
User password field should be unreadable hash, not plaintext
```

### 2. Code Validation
**Test**:
- [ ] Can't use same code twice
- [ ] Can't use expired code
- [ ] Can't use revoked code

### 3. Email Verification
**Test**:
- [ ] Code must match assigned email (if set)
- [ ] Can't register with someone else's email

### 4. Authentication
**Test**:
- [ ] Only authenticated admins can generate codes
- [ ] Only authenticated admins can view/revoke codes
- [ ] Teacher registration endpoint is public (no auth required)

### 5. Activity Logging
**Check**:
- [ ] All code operations logged
- [ ] Logs include who, when, what
- [ ] Registration tracked in activity log

---

## ✅ PERFORMANCE VERIFICATION

### 1. Code Generation Speed
- [ ] Code generates < 100ms
- [ ] Email sends < 2 seconds

### 2. Registration Speed
- [ ] Validation completes < 100ms
- [ ] User creation < 500ms
- [ ] Total registration < 1 second

### 3. No Memory Leaks
- [ ] Keep frontend open for 5+ minutes
- [ ] Check developer tools memory
- [ ] Memory usage stable (not growing)

---

## ✅ ACCESSIBILITY VERIFICATION

### 1. Keyboard Navigation
- [ ] Tab cycles through all form fields
- [ ] Submit button accessible via keyboard
- [ ] Enter key submits form

### 2. Screen Reader
- [ ] Labels associated with inputs
- [ ] Error messages announced
- [ ] Success messages announced

### 3. Color Contrast
- [ ] All text readable
- [ ] Error messages clearly visible
- [ ] Buttons have sufficient contrast

---

## 🐛 TROUBLESHOOTING CHECKLIST

### Backend Not Responding
- [ ] Check server is running (`npm start`)
- [ ] Check port (default 3000)
- [ ] Check firewall allows connections
- [ ] Check .env has API_PORT set (if custom)

### Frontend Can't Reach Backend
- [ ] Check VITE_API_URL environment variable
- [ ] Check backend server is running
- [ ] Check CORS configuration on backend
- [ ] Check browser console for network errors

### Email Not Sending
- [ ] Check RESEND_API_KEY is valid
- [ ] Check RESEND_FROM_EMAIL is verified
- [ ] Check internet connection
- [ ] Check Resend dashboard for errors

### Database Issues
- [ ] Check Firestore/Supabase connection
- [ ] Check credentials in .env
- [ ] Check collections exist
- [ ] Check document structure matches

### Component Not Loading
- [ ] Check TeacherRegistrationForm.vue exists
- [ ] Check router configuration
- [ ] Check no import errors in browser console
- [ ] Check TypeScript types are correct

---

## 📋 SIGN-OFF CHECKLIST

When all tests pass, mark complete:

- [ ] All backend endpoints tested
- [ ] All frontend fields validated
- [ ] Complete E2E flow works
- [ ] Error handling verified
- [ ] Security measures checked
- [ ] Performance acceptable
- [ ] Accessibility verified
- [ ] Code marked as ready for production

---

**Test Date**: ___________
**Tested By**: ___________
**Status**: ☐ Ready ☐ Issues Found

**Issues Found** (if any):
- [ ] Issue 1: ________________
- [ ] Issue 2: ________________
- [ ] Issue 3: ________________
