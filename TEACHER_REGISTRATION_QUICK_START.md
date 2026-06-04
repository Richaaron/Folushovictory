# Teacher Registration & Code Management - Quick Start Guide

## 🎯 Overview

Teachers can now self-register using a unique registration code that automatically assigns their subjects and form class. This guide shows how to:
1. **Admins**: Generate and distribute registration codes
2. **Teachers**: Register using their code
3. **Testing**: Verify the full registration flow

---

## 👨‍💼 ADMIN WORKFLOW

### Step 1: Generate Registration Code

**Endpoint**: `POST /api/admin/registration-codes`

**Using cURL**:
```bash
curl -X POST http://localhost:3000/api/admin/registration-codes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "displayName": "Sarah Johnson",
    "email": "sarah@school.com",
    "subjectIds": ["mathematics", "physics"],
    "formClassId": "ss1-b",
    "expiryDays": 30
  }'
```

**Response**:
```json
{
  "success": true,
  "message": "✅ Registration code generated successfully",
  "code": {
    "code": "WXYZ-MNOP-QRST",
    "displayName": "Sarah Johnson",
    "email": "sarah@school.com",
    "subjectsCount": 2,
    "formClassAssigned": true,
    "expiresAt": "2026-07-04T...",
    "createdAt": "2026-06-04T...",
    "status": "ACTIVE"
  }
}
```

**Key Points**:
- `displayName` (required): Teacher's full name
- `email` (optional): Pre-assigned email (teacher must use this for registration)
- `subjectIds` (optional): Array of subject IDs to assign
- `formClassId` (optional): Form class ID to assign
- `expiryDays` (optional): Days until code expires (default: 90)

---

### Step 2: View Generated Codes

**Endpoint**: `GET /api/admin/registration-codes?status=ACTIVE`

**Using cURL**:
```bash
curl -X GET "http://localhost:3000/api/admin/registration-codes?status=ACTIVE" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Query Parameters**:
- `status`: ACTIVE, USED, EXPIRED, REVOKED
- `used`: true or false

---

### Step 3: Send Code to Teacher's Email

**Endpoint**: `POST /api/admin/registration-codes/:code/send`

**Using cURL**:
```bash
curl -X POST http://localhost:3000/api/admin/registration-codes/WXYZ-MNOP-QRST/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "recipientEmail": "sarah@school.com"
  }'
```

**What Teacher Receives**:
- Professional HTML email with:
  - Registration code in large format
  - Number of subjects assigned
  - Form class assignment info
  - Code expiry date
  - Step-by-step registration instructions
  - Link to registration portal

---

### Step 4: Monitor Code Usage

**Endpoint**: `GET /api/admin/registration-codes/:code`

**Using cURL**:
```bash
curl -X GET http://localhost:3000/api/admin/registration-codes/WXYZ-MNOP-QRST \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Response Fields**:
- `status`: Current state (ACTIVE, USED, REVOKED, EXPIRED)
- `used`: Boolean flag
- `usedBy`: Teacher's username (if used)
- `usedAt`: Timestamp of registration (if used)

---

### Step 5: Revoke a Code (if needed)

**Endpoint**: `DELETE /api/admin/registration-codes/:code`

**Using cURL**:
```bash
curl -X DELETE http://localhost:3000/api/admin/registration-codes/WXYZ-MNOP-QRST \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Note**: Can only revoke unused codes. If teacher already registered, code is automatically marked as used.

---

## 👨‍🏫 TEACHER WORKFLOW

### Step 1: Receive Registration Code

Teacher receives email from admin containing:
- Registration code (e.g., WXYZ-MNOP-QRST)
- Link to registration page
- Instructions

---

### Step 2: Visit Registration Page

Navigate to: `http://your-app/register/teacher`

Or click link from email.

---

### Step 3: Fill Registration Form

**Required Fields**:

| Field | Format | Example |
|-------|--------|---------|
| **Email Address** | Valid email | sarah@school.com |
| **Full Name** | At least 2 characters | Sarah Johnson |
| **Password** | Minimum 6 characters | SecurePass123 |
| **Registration Code** | tch-2026-NNN | tch-2026-001 |

**Registration Form Features**:
- ✅ Real-time validation of all fields
- ✅ Code format validation (tch-2026-NNN)
- ✅ Case-insensitive code entry (automatically converted to uppercase)
- ✅ Password visibility toggle
- ✅ Clear error messages
- ✅ Copy username to clipboard (after registration)

---

### Step 4: Submit Registration

Click **"Create Account"** button.

System validates:
1. ✅ Code is valid and not expired
2. ✅ Code hasn't been used before
3. ✅ Email matches code (if pre-assigned)
4. ✅ Email not already registered
5. ✅ All form fields are complete

---

### Step 5: Success - Get Username

Upon successful registration:

**Display Shows**:
- ✅ Auto-generated username (format: `tch-2026-NNN`)
- ✅ Confirmation of email
- ✅ Summary of assigned subjects
- ✅ Form class assignment status

**Teacher Can**:
- 📋 Copy username to clipboard
- 🔗 Click to go to login page
- 📧 Check email for welcome message

---

### Step 6: Login & Start Using Portal

Teacher logs in with:
- **Username**: Provided on success screen
- **Password**: Password created during registration

Portal automatically displays:
- Assigned subjects
- Form class allocations
- Ready to enter student results

---

## 🧪 COMPLETE TESTING WORKFLOW

### Test Scenario: Complete Registration Flow

#### Prerequisites:
- Admin authenticated with token
- Teacher email address ready
- Subject and form class IDs exist in system

#### Test Steps:

**1. Generate Code (Admin)**
```bash
curl -X POST http://localhost:3000/api/admin/registration-codes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer admin_token" \
  -d '{
    "displayName": "Test Teacher",
    "email": "test@school.com",
    "subjectIds": ["math-001", "english-002"],
    "formClassId": "jss-1a",
    "expiryDays": 7
  }'
```

**Expected**: Returns code like `ABCD-EFGH-IJKL`

**2. List Codes (Admin)**
```bash
curl -X GET "http://localhost:3000/api/admin/registration-codes?status=ACTIVE" \
  -H "Authorization: Bearer admin_token"
```

**Expected**: Code appears with status ACTIVE

**3. Send Email (Admin)**
```bash
curl -X POST http://localhost:3000/api/admin/registration-codes/ABCD-EFGH-IJKL/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer admin_token" \
  -d '{
    "recipientEmail": "test@school.com"
  }'
```

**Expected**: Email sent successfully (check email backend logs)

**4. Teacher Registers**

Visit: `http://localhost:5173/register/teacher` (or your frontend URL)

Fill form:
- Email: `test@school.com`
- Full Name: `Test Teacher`
- Password: `TestPass123`
- Code: `ABCD-EFGH-IJKL`

Click "Create Account"

**Expected**: Success screen shows:
- Username: `tch-2026-001` (or similar)
- Email confirmation
- "2 subject(s) assigned"
- "Form class assigned"

**5. Verify Code Usage (Admin)**
```bash
curl -X GET http://localhost:3000/api/admin/registration-codes/ABCD-EFGH-IJKL \
  -H "Authorization: Bearer admin_token"
```

**Expected Response**:
```json
{
  "code": "ABCD-EFGH-IJKL",
  "status": "USED",
  "used": true,
  "usedBy": "tch-2026-001",
  "usedAt": "2026-06-04T...",
  ...
}
```

**6. Verify Teacher Created**

Check database or login as teacher:
- Username: `tch-2026-001`
- Password: `TestPass123`
- Check: `subjectIds` contains both subjects
- Check: `formClassId` is `jss-1a`

**7. Test Code Reuse (Should Fail)**

Try registering again with same code:
- Email: `another@school.com`
- Code: `ABCD-EFGH-IJKL`

**Expected**: Returns error
```json
{
  "error": "Invalid or expired registration code. Please contact administration.",
  "code": "INVALID_CODE"
}
```

---

## ⚠️ ERROR MESSAGES & SOLUTIONS

### Invalid Code
**Error**: "The registration code is invalid or expired"
**Causes**:
- Code doesn't exist
- Code has been used
- Code has been revoked
- Code has expired
**Solution**: Ask admin to generate new code

### Email Mismatch
**Error**: "Email does not match the registration code"
**Cause**: Code was issued for a specific email address
**Solution**: Use the same email provided by admin

### Email Already Registered
**Error**: "This email is already registered"
**Cause**: Email is used by another account
**Solution**: Use different email or contact admin

### Invalid Code Format
**Error**: "Code must be in format tch-2026-NNN (e.g., tch-2026-001)"
**Cause**: Entered code doesn't match pattern
**Solution**: Verify code format starts with tch-2026- and ends with 3-digit number

---

## 📧 EMAIL TEMPLATES

### Code Distribution Email (Sent to Teacher)

**Subject**: `Teacher Registration Code - [School Name]`

**Content**:
```
Dear [Teacher Name],

Your school administrator has created a registration code for you to join 
the FVS Teacher Portal. Use the code below to create your account.

Registration Code: [CODE in large font]

✓ Subjects Assigned: [Count]
✓ Form Class Assigned: [Yes/No]

Expiry Date: [Date]

To register:
1. Visit: [Registration Link]
2. Enter your email and create a password
3. Paste your registration code
4. Click "Create Account"

Questions? Contact your administrator.
```

### Welcome Email (Sent After Registration)

**Subject**: `Welcome to FVS Teacher Portal - Your Account is Ready`

**Content**:
```
Welcome [Teacher Name]!

Your account has been created successfully.

Username: [tch-2026-001]
Email: [email@school.com]

Your Allocations:
✓ 2 subject(s) assigned
✓ Form class assigned

Your subjects and class allocation have been automatically configured.
You can start entering results immediately!

Login: [Portal Link]
```

---

## 🔧 ENVIRONMENT VARIABLES NEEDED

Add these to your `.env` files:

**Backend (.env)**:
```
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=admin@school.com
FRONTEND_ORIGIN=http://localhost:5173
REGISTRATION_CODE_SECRET=your-secret-key-2026
```

**Frontend (.env)**:
```
VITE_API_URL=http://localhost:3000
```

---

## 📊 MONITORING & AUDITING

### Activity Log Tracking

All registration code operations are logged with:
- **Who**: Admin username
- **When**: Timestamp
- **What**: Action (generated, sent, revoked, used)
- **Details**: Code, teacher name, subjects, form class

Check activity logs for:
- ✅ Which codes were generated
- ✅ When codes were sent
- ✅ Which teacher registered with code
- ✅ Which codes were revoked

---

## 🚀 BEST PRACTICES

### For Admins

✅ **Do**:
- Generate codes with specific teacher allocations
- Set appropriate expiry dates (e.g., 30 days)
- Verify email addresses match teacher records
- Monitor code usage for enrollment tracking
- Keep activity logs for audit purposes

❌ **Don't**:
- Share codes with unauthorized people
- Create codes without allocations
- Set very long expiry dates (security risk)
- Forget to send codes via email

### For Teachers

✅ **Do**:
- Guard your registration code
- Use the email provided by admin
- Create strong password (min 6 chars)
- Check email for welcome message
- Login immediately after registration

❌ **Don't**:
- Share code with other teachers
- Lose your code (ask admin for new one)
- Use someone else's code
- Register twice with different emails

---

## 🐛 TROUBLESHOOTING

| Issue | Cause | Solution |
|-------|-------|----------|
| Code expired | Too much time passed | Ask admin for new code |
| Code not found | Wrong code entered | Double-check code format (tch-2026-NNN) |
| Email mismatch | Using wrong email | Use email code was issued for |
| Code validation error | Code format incorrect | Verify format: tch-2026-001, tch-2026-042, etc. |
| Email not received | Email service down | Check with admin to resend |
| Can't login after registration | Password forgotten | Click "Forgot Password" link |
| Subjects not assigned | Code created without subjects | Ask admin to revoke and regenerate code |

---

## 📞 SUPPORT

For technical issues:
1. Check error message displayed
2. Verify code format matches tch-2026-NNN (e.g., tch-2026-001)
3. Confirm email matches code
4. Contact administrator for new code

For account issues:
1. Verify username (which is the registration code) and password
2. Use "Forgot Password" if needed
3. Contact school administration

---

## 📝 SUMMARY

| Role | Action | Endpoint | Status |
|------|--------|----------|--------|
| Admin | Generate code | POST /api/admin/registration-codes | ✅ Ready |
| Admin | List codes | GET /api/admin/registration-codes | ✅ Ready |
| Admin | Get code details | GET /api/admin/registration-codes/:code | ✅ Ready |
| Admin | Send code email | POST /api/admin/registration-codes/:code/send | ✅ Ready |
| Admin | Revoke code | DELETE /api/admin/registration-codes/:code | ✅ Ready |
| Teacher | Register with code | POST /api/auth/register/teacher | ✅ Ready |
| Teacher | View form | GET /register/teacher | ✅ Ready |

---

**Last Updated**: 2026-06-04  
**Status**: ✅ Complete and Ready for Use  
**Version**: 1.0.0
