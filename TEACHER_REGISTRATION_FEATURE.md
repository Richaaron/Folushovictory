# Teacher Accounts and Self-Registration

> Student sign-in and assignments/tests are documented separately in [STUDENT_PORTAL.md](./STUDENT_PORTAL.md).

## Overview
An administrator can create a teacher account directly from the Staff Faculty page. The platform assigns the teacher code, creates the account, configures class and subject allocations, and emails the login details to the teacher. Teachers can also complete registration from an existing email-bound invitation.

## Features

✅ **Direct Admin Enrollment**: Admins can create teacher accounts without requiring the teacher to sign up with an invitation code
✅ **Automatic Login Email**: Newly created accounts receive a teacher code and temporary password by email
✅ **Email-Bound Codes**: New 128-bit random invitation codes are tied to the teacher's email
✅ **Teacher-Selected Allocations**: Teachers choose only from their invitation's approved class or subjects
✅ **Automatic Welcome Email**: The teacher code and login instructions are emailed after account creation
✅ **Activity Logging**: Registration activities are logged for audit trail  
✅ **Email Validation**: Ensures emails are unique and valid format  
✅ **Password Security**: Passwords are securely hashed with bcryptjs  

## How It Works

### Admin Enrollment Flow

1. An administrator selects **Enroll New Faculty**, enters the teacher's name and email, and assigns their class/subjects
2. The system creates the teacher account and assigns a teacher code and temporary password
3. The login details are emailed automatically; if email delivery fails, the administrator gets a copyable temporary password and can use **Resend Credentials** to retry
4. The teacher signs in with the teacher code and temporary password, then changes the password

### Existing Invitation Registration

1. **Invitation**
   - An administrator creates an invitation with the teacher's email and approved allocation options
   - The registration code and link are emailed automatically
   - If email delivery fails, the administrator can share the displayed code manually or resend it

2. **Teacher Registration**
   - Teacher opens the invitation and verifies it with their email and registration code
   - Enters their name, chooses Form Teacher or Subject Teacher, selects an approved class or subjects, and creates a password
   - The registration code becomes the teacher's username

3. **Account Creation**
   - User record created in database
   - Password securely hashed
   - Account marked as TEACHER role

4. **Welcome Email**
   - Email sent with the teacher code and portal link
   - Teacher uses the password they created during registration

5. **Login**
   - Teacher logs in with their email or teacher code and the password they created
   - Activity logged for audit trail

## API Endpoint

### POST `/api/admin/teachers`

Creates the teacher account and emails a generated teacher code and temporary password.

**Request Body:**
```json
{
  "displayName": "John Smith",
  "email": "teacher@school.com",
  "formClassId": "class-id",
  "subjectIds": ["subject-id"]
}
```

The teacher must have a form class, one or more subjects, or both. The admin response includes the teacher code and whether the email was sent; the temporary password is not returned.

### POST `/api/auth/register/teacher`

**Request Body:**
```json
{
  "email": "teacher@school.com",
  "password": "SecurePass123",
  "displayName": "John Smith",
  "registrationCode": "tch-2026-a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
  "teacherType": "SUBJECT_TEACHER",
  "formClassId": null,
  "subjectIds": ["subject-id"]
}
```

**Required Fields:**
- `email` (string): Valid email address, must be unique
- `password` (string): Minimum 6 characters
- `displayName` (string): Teacher's full name
- `registrationCode` (string): Active, email-bound code provided by the school administrator
- `teacherType` (string): `FORM_TEACHER` or `SUBJECT_TEACHER`
- `formClassId` (string or null): The authorized form class for a form teacher
- `subjectIds` (string[]): One or more subjects authorized by the invitation

**Success Response (201):**
```json
{
  "success": true,
  "message": "Account created successfully.",
  "user": {
    "username": "tch-2026-a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
    "email": "teacher@school.com",
    "displayName": "John Smith",
    "role": "TEACHER",
    "portal": "TEACHER",
    "emailSent": true,
    "emailError": null
  }
}
```

**Error Responses:**

- `400 Bad Request`: Missing or invalid fields
```json
{
  "error": "Missing or invalid displayName"
}
```

- `409 Conflict`: Email already registered
```json
{
  "error": "Email already registered"
}
```

## Important Notes

### This Feature is ONLY for Teachers
- Parents and Admins do NOT use this endpoint
- Parents are created by admins as needed
- Admins use the admin portal to add other staff

### Automatic Email Sending
- Admin-created accounts receive the teacher code and temporary password; the response reports `emailSent`
- If email service is down, account creation still completes and the admin can resend credentials
- Self-registered accounts receive the teacher code by email and use their chosen password
- Check backend logs for email delivery status

### Teacher Codes
- New invitation codes use a random 128-bit token in format `tch-YYYY-<32 hex characters>`
- The code becomes the teacher's username and is emailed after account creation
- Previously issued sequential invitations must be replaced with a new invitation before registration

### Password Security
- Passwords must be at least 6 characters
- Passwords are hashed using bcryptjs (one-way encryption)
- Teachers can change their password after login

## Frontend Integration

### Registration Form
```javascript
// Example: Teacher registration form submission
async function registerTeacher() {
  const response = await fetch('/api/auth/register/teacher', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'teacher@school.com',
      password: 'SecurePass123',
      displayName: 'John Smith',
      registrationCode: 'tch-2026-a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6',
      teacherType: 'SUBJECT_TEACHER',
      formClassId: null,
      subjectIds: ['subject-id']
    })
  });

  if (response.ok) {
    const data = await response.json();
    console.log('Registration successful!', data.user.username);
    // Redirect to login page
    window.location.href = '/login/teacher';
  } else {
    const error = await response.json();
    console.error('Registration failed:', error.error);
  }
}
```

### Login After Registration
Teachers use their email or invitation code with their password to log in:
- **Teacher code**: the code from the invitation email or registration response
- **Password**: The password they created during registration
- **Portal**: TEACHER

## Email Notification

Admin-created teacher accounts receive an email containing:
- Teacher code
- Temporary password
- Link to teacher portal
- Reminder to change the temporary password after signing in

Self-registered teachers receive a welcome email containing:
- Welcome message
- Teacher code
- Link to teacher portal
- Tips for getting started
- Contact information for support

## Admin Considerations

### Admin Creates Teacher Accounts
From Staff Faculty, the administrator enters the teacher's email and class/subject allocations. The system creates the account and emails a teacher code and temporary password. No registration code or separate teacher signup is needed for this flow.

### Both Methods Coexist
- **Self-Registration** (`/api/auth/register/teacher`): Teacher-driven, email/password method
- **Admin Enrollment** (`/api/admin/teachers`): Admin-driven account creation with automatically emailed login details
- **Existing Invitations** (`/api/admin/registration-codes`): Legacy invitation flow remains available for already issued invitations

## Audit & Logging

All teacher registrations are logged with:
- Teacher username
- Registration timestamp
- Email address used
- Admin-created accounts and self-registrations use distinct audit actions
- Activity can be viewed in backend logs

## Security Considerations

✅ **Email Validation**: Invalid emails are rejected  
✅ **Unique Email**: Prevents duplicate registrations  
✅ **Password Hashing**: Passwords never stored in plain text  
✅ **Temporary Passwords**: Admin-created teacher passwords are randomly generated and only included in the email
✅ **Minimum Length**: Passwords must be at least 6 chars (system best practice)  
✅ **Activity Logging**: All registrations tracked for audit trail  

## Troubleshooting

### Registration Fails with "Email already registered"
- Email is already in use
- Teacher must use different email or reset via admin

### Teacher Doesn't Receive Welcome Email
- Check email address spelling
- Verify RESEND_API_KEY is configured
- Check backend logs for email service errors
- Teacher can proceed to login even if email fails

### Teacher Forgot Username
- Check the registration response (includes username)
- Admin can look up teacher in database by email
- Admin can send credentials via `/api/admin/teachers/{username}/resend-credentials`

## Configuration

Ensure these environment variables are set:
```
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@folushovictory.online
FRONTEND_ORIGIN=https://folushovictory.netlify.app
```

## Database Schema

Before using direct teacher enrollment on an existing Supabase database, run
[`backend/scripts/add_teacher_profile_fields.sql`](./backend/scripts/add_teacher_profile_fields.sql)
in the Supabase SQL Editor. It adds the `teacherType` and `formClassId` columns
written when a teacher account is created. The fresh-install schema already
includes these fields.

Teacher records in the `users` table contain:
- `username`: Unique teacher code (new invitations use `tch-YYYY-<32 hex characters>`)
- `email`: Teacher email address
- `passwordHash`: Bcrypt hashed password
- `displayName`: Teacher full name
- `role`: "TEACHER"
- `portal`: "TEACHER"
- `formClassId`: Assigned class (null until assigned)
- `createdAt`: Registration timestamp

## Testing

### Manual Test Flow
1. Call registration endpoint with test data
2. Verify user record created in database
3. Verify welcome email sent (check logs)
4. Login with the teacher code or email and the password created during registration
5. Verify activity logged

### cURL Example
```bash
curl -X POST http://localhost:3000/api/auth/register/teacher \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testteacher@school.com",
    "password": "TestPass123",
    "displayName": "Test Teacher",
    "registrationCode": "tch-2026-a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
    "teacherType": "SUBJECT_TEACHER",
    "formClassId": null,
    "subjectIds": ["subject-id"]
  }'
```

## Future Enhancements

Consider adding:
- Email verification step before full account activation
- Social login (Google, Microsoft) for teachers
- Multi-factor authentication (MFA)
- Teacher profile completion wizard
- Integration with teacher directory/LDAP
- Bulk import of teachers with self-registration codes

---

**Last Updated**: 2026-06-04  
**Feature Status**: ✅ Active  
**Version**: 1.0.0
