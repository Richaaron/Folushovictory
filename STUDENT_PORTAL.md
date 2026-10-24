# Student Learning Portal

## Student access

New students receive an admission number and an 8-digit PIN when an administrator enrolls them. The PIN is hashed in the database; it is shown to the administrator once after enrollment so it can be shared privately with the student. Students sign in at `/login/student` with both values and can change their PIN in their portal. An administrator can issue a replacement PIN from Student Enrollment.

Students enrolled before this feature need an administrator to reset their PIN before their first login.

## Learning activities

Teachers can open **Activities** in the Teacher Portal to publish a written assignment or multiple-choice test to a class/subject they teach. Student accounts see the class subjects and published activities immediately after signing in. Assignments accept a written response and are marked by the teacher. Tests are marked automatically and the score is shown after submission. Activities have one submission per student; assignments may be edited until the teacher marks them, while tests may only be submitted once.

## Database setup

Before deploying this feature, run [`backend/scripts/add_student_learning_portal.sql`](./backend/scripts/add_student_learning_portal.sql) against the Supabase database. The script creates the learning activity and submission tables and indexes. The main [`backend/scripts/supabase_schema.sql`](./backend/scripts/supabase_schema.sql) also contains these definitions for fresh installations.

## Notes

- Student PINs are 8-digit random values and are stored using the same bcrypt hash mechanism as account passwords.
- Admission number alone is not accepted as student authentication.
- Uploaded files are not supported for assignment submissions; students submit text responses.
- Online tests currently support multiple-choice questions with automatic marking.
