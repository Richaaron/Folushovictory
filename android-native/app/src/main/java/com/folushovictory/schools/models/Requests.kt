package com.folushovictory.schools.models

data class TeacherCreateRequest(
    val displayName: String,
    val email: String? = null,
    val formClassId: String? = null
)

data class TeacherUpdateRequest(
    val displayName: String? = null,
    val email: String? = null,
    val formClassId: String? = null
)

data class CreateTeacherResponse(
    val username: String,
    val password: String,
    val email: String? = null,
    val emailSent: Boolean = false,
    val message: String? = null
)

data class StudentCreateRequest(
    val firstName: String,
    val lastName: String,
    val classId: String,
    val parentName: String,
    val parentEmail: String? = null,
    val gender: String? = null,
    val stream: String? = null,
    val subjectIds: List<String>? = null
)

data class StudentUpdateRequest(
    val firstName: String? = null,
    val lastName: String? = null,
    val classId: String? = null,
    val parentName: String? = null,
    val parentEmail: String? = null,
    val gender: String? = null,
    val stream: String? = null,
    val subjectIds: List<String>? = null
)

data class ClassCreateRequest(
    val name: String,
    val level: String,
    val track: String? = null,
    val assessmentType: String? = null,
    val formTeacherUsername: String? = null
)

data class ClassUpdateRequest(
    val name: String? = null,
    val level: String? = null,
    val track: String? = null,
    val assessmentType: String? = null,
    val formTeacherUsername: String? = null
)

data class ScoreListResponse(
    val scores: List<Score>
)

data class Subject(
    val id: String,
    val name: String,
    val level: String? = null,
    val track: String? = null
)

data class SubjectsResponse(
    val subjects: List<Subject>
)

data class TermMetaRequest(
    val session: String,
    val term: String,
    val resumptionDate: String
)

data class PublishResultsRequest(
    val classId: String,
    val session: String,
    val term: String
)

data class PrincipalRemarkRequest(
    val session: String,
    val term: String,
    val studentId: String,
    val principalRemark: String
)

data class TeacherRemarkRequest(
    val session: String,
    val term: String,
    val studentId: String,
    val teacherRemark: String
)

data class GradeScaleEntry(
    val letter: String,
    val min: Int,
    val max: Int,
    val remark: String? = null
)

data class GradingScaleRequest(
    val grades: List<GradeScaleEntry>
)

data class GradingScaleResponse(
    val grades: List<GradeScaleEntry> = emptyList()
)

data class AdminAssignmentRequest(
    val teacherUsername: String,
    val subjectIds: List<String>? = null,
    val classIds: List<String>? = null
)

data class AssignmentsActionResponse(
    val count: Int,
    val assignments: List<Assignment> = emptyList(),
    val message: String? = null
)

data class ChangePasswordRequest(
    val oldPassword: String,
    val newPassword: String
)

data class GenericApiResponse(
    val success: Boolean = false,
    val message: String? = null
)

data class PasswordResetRequest(
    val email: String,
    val portal: String
)

data class VerifyRecoveryCodeRequest(
    val email: String,
    val recoveryCode: String
)

data class ResetPasswordRequest(
    val email: String,
    val recoveryCode: String,
    val newPassword: String,
    val portal: String
)

data class AvailableSessionsResponse(
    val success: Boolean = false,
    val data: List<String> = emptyList(),
    val message: String? = null
)
