# Teacher Self-Registration Feature

## Overview
An administrator creates a registration invitation with a one-time code. Teachers use that code with their email, name, and password to create their account.

## Features

✅ **Invitation-Only Registration**: Only teachers with an admin-issued invitation can sign up
✅ **Email-Bound Codes**: New 128-bit random invitation codes are tied to the teacher's email
✅ **Teacher-Selected Allocations**: Teachers choose only from their invitation's approved class or subjects
✅ **Automatic Welcome Email**: The teacher code and login instructions are emailed after account creation
✅ **Activity Logging**: Registration activities are logged for audit trail  
✅ **Email Validation**: Ensures emails are unique and valid format  
✅ **Password Security**: Passwords are securely hashed with bcryptjs  

## How It Works

### Registration Flow

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
   - Teacher uses the password they created during registration; passwords are never emailed

5. **Login**
   - Teacher logs in with their email or teacher code and the password they created
   - Activity logged for audit trail

## API Endpoint

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
- The welcome email is sent after account creation; the response reports `emailSent`
- If email service is down, registration still completes and the teacher code is shown on screen
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

Teachers receive a professional welcome email containing:
- Welcome message
- Login username
- Link to teacher portal
- Tips for getting started
- Contact information for support

## Admin Considerations

### Admin Creates Registration Invitations
The admin portal requires a teacher email and creates an invitation with approved subject and class allocations. The teacher verifies the code with that email and completes account setup at `/register/teacher`.

### Both Methods Coexist
- **Self-Registration** (`/api/auth/register/teacher`): Teacher-driven, email/password method
- **Admin Invitation** (`/api/admin/registration-codes`): Admin-driven, code-based account setup

## Audit & Logging

All teacher registrations are logged with:
- Teacher username
- Registration timestamp
- Email address used
- Action: "Teacher self-registration"
- Activity can be viewed in backend logs

## Security Considerations

✅ **Email Validation**: Invalid emails are rejected  
✅ **Unique Email**: Prevents duplicate registrations  
✅ **Password Hashing**: Passwords never stored in plain text  
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
RESEND_FROM_EMAIL=noreply@folushovictory.com
FRONTEND_ORIGIN=https://folushovictory.netlify.app
```

## Database Schema

Teacher records in `users` collection contain:
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
