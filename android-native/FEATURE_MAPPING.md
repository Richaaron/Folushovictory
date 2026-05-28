# Feature mapping: Web (Vue) -> Android (native)

This file maps routes and views from the `frontend-vue` app to the existing Android native screens in `android-native`.

- `/` (landing) -> `LoginActivity` / splash (no dedicated landing fragment)
- `/login/:portal?` (login) -> `LoginActivity`
- `/forgot-password/:portal?` -> (not implemented) — consider `ForgotPasswordFragment` (create)
- `/report/:studentId` -> `StudentReportFragment`
- `/bulk-reports/:classId` -> `ParentReportsFragment` or `AdminResultsFragment` (depending on portal)

Admin routes (under `/admin`):
- `admin-dashboard` -> `DashboardFragment` (admin view)
- `admin-teachers` -> `TeachersFragment`
- `admin-classes` -> `ClassesFragment`
- `admin-students` -> `StudentsFragment`
- `admin-broadsheet` -> `BroadsheetFragment`
- `settings` -> `SettingsFragment`

Teacher routes (under `/teacher`):
- `teacher-dashboard` -> `TeacherDashboardFragment`
- `teacher-scores` (`/teacher/scores/:id`) -> `ScoreEntryFragment` or `AdminScoreEntryFragment` (portal-specific)
- `teacher-form-class` -> `FormClassFragment`
- `teacher-broadsheet` -> `BroadsheetFragment`
- `teacher-settings` -> `SettingsFragment`

Parent routes (under `/parent`):
- `parent-dashboard` -> `ParentDashboardFragment`
- `parent-settings` -> `SettingsFragment`

Notes / Next steps:
- Implement missing screens: `ForgotPasswordFragment`, any admin-specific dashboards not present.
- Map specific API payloads used by Vue components to the Android `ApiService` models and ViewModels.
- Add deep-link support for URLs like `/report/:studentId` (Android intent filters) if needed.
