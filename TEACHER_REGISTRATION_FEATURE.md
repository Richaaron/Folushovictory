# Teacher Self-Registration Feature

## Overview
An administrator creates a registration invitation with a one-time code. Teachers use that code with their email, name, and password to create their account.

## Features

✅ **Code-Based Registration**: Teachers register with an administrator-provided code
✅ **Auto-Generated Usernames**: Usernames follow format `tch-YYYY-NNN` (e.g., `tch-2026-001`)  
✅ **Automatic Welcome Email**: Teachers receive login credentials via email  
✅ **Activity Logging**: Registration activities are logged for audit trail  
✅ **Email Validation**: Ensures emails are unique and valid format  
✅ **Password Security**: Passwords are securely hashed with bcryptjs  

## How It Works

### Registration Flow

1. **Invitation**
   - An administrator creates a registration code and shares it with the teacher
   - The code can be used to open the registration page with the code prefilled

2. **Teacher Registration**
   - Teacher navigates to the registration page
   - Enters: Full Name, Email, Password (min 6 characters), and registration code
   - System validates input
   - The registration code becomes the teacher's username

3. **Account Creation**
   - User record created in database
   - Password securely hashed
   - Account marked as TEACHER role

4. **Welcome Email**
   - Automatic email sent with login credentials
   - Includes username and portal link
   - Professional branded template

5. **Login**
   - Teacher logs in with generated username and their password
   - Activity logged for audit trail

## API Endpoint

### POST `/api/auth/register/teacher`

**Request Body:**
```json
{
  "email": "teacher@school.com",
  "password": "SecurePass123",
  "displayName": "John Smith",
  "registrationCode": "tch-2026-001"
}
```

**Required Fields:**
- `email` (string): Valid email address, must be unique
- `password` (string): Minimum 6 characters
- `displayName` (string): Teacher's full name
- `registrationCode` (string): Active code provided by the school administrator

**Success Response (201):**
```json
{
  "success": true,
  "message": "✅ Account created successfully! A welcome email has been sent to your email address.",
  "user": {
    "username": "tch-2026-001",
    "email": "teacher@school.com",
    "displayName": "John Smith",
    "role": "TEACHER",
    "portal": "TEACHER"
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
- Welcome email is sent asynchronously (doesn't block registration)
- If email service is down, registration still completes
- Check backend logs for email delivery status

### Username Generation
- Usernames are auto-generated in format: `tch-YYYY-NNN`
- Example: `tch-2026-001`, `tch-2026-002`, etc.
- Year portion auto-updates to current year
- Counter increments for each new teacher

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
      displayName: 'John Smith'
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
Teachers use the generated username with their password to login:
- **Username**: `tch-2026-001` (from registration response)
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
The admin portal creates a registration invitation with a code and optional email, subject, and class allocations. The teacher uses the code to finish account setup at `/register/teacher`.

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
- `username`: Unique teacher ID (tch-YYYY-NNN)
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
4. Login with generated username and password
5. Verify activity logged

### cURL Example
```bash
curl -X POST http://localhost:3000/api/auth/register/teacher \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testteacher@school.com",
    "password": "TestPass123",
    "displayName": "Test Teacher"
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
