package com.folushovictory.schools.api

import com.folushovictory.schools.models.AssignmentsResponse
import com.folushovictory.schools.models.ClassCreateRequest
import com.folushovictory.schools.models.ClassUpdateRequest
import com.folushovictory.schools.models.ClassesResponse
import com.folushovictory.schools.models.CreateTeacherResponse
import com.folushovictory.schools.models.DashboardData
import com.folushovictory.schools.models.LoginRequest
import com.folushovictory.schools.models.LoginResponse
import com.folushovictory.schools.models.ScoreListResponse
import com.folushovictory.schools.models.ScoresRequest
import com.folushovictory.schools.models.SchoolSettings
import com.folushovictory.schools.models.Student
import com.folushovictory.schools.models.StudentCreateRequest
import com.folushovictory.schools.models.StudentReportResponse
import com.folushovictory.schools.models.StudentUpdateRequest
import com.folushovictory.schools.models.Subject
import com.folushovictory.schools.models.SubjectsResponse
import com.folushovictory.schools.models.StudentsResponse
import com.folushovictory.schools.models.TermMetaRequest
import com.folushovictory.schools.models.PublishResultsRequest
import com.folushovictory.schools.models.TeacherCreateRequest
import com.folushovictory.schools.models.TeacherUpdateRequest
import com.folushovictory.schools.models.TeachersResponse
import com.folushovictory.schools.models.User
import com.folushovictory.schools.models.AdminAssignmentRequest
import com.folushovictory.schools.models.AssignmentsActionResponse
import com.folushovictory.schools.models.GradingScaleRequest
import com.folushovictory.schools.models.GradingScaleResponse
import com.folushovictory.schools.models.TeacherDashboardData
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query
import com.folushovictory.schools.models.AvailableSessionsResponse
import com.folushovictory.schools.models.GenericApiResponse
import com.folushovictory.schools.models.PasswordResetRequest
import com.folushovictory.schools.models.ResetPasswordRequest
import com.folushovictory.schools.models.VerifyRecoveryCodeRequest

interface ApiService {
    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>
    
    @GET("api/me")
    suspend fun getCurrentUser(@Header("Authorization") token: String): Response<User>
    
    @GET("api/admin/dashboard")
    suspend fun getAdminDashboard(): Response<DashboardData>
    
    @POST("api/admin/teachers")
    suspend fun createTeacher(@Body request: TeacherCreateRequest): Response<CreateTeacherResponse>

    @PUT("api/admin/teachers/{username}")
    suspend fun updateTeacher(@Path("username") username: String, @Body request: TeacherUpdateRequest): Response<Unit>

    @GET("api/admin/teachers")
    suspend fun getTeachers(): Response<TeachersResponse>
    
    @POST("api/admin/students")
    suspend fun createStudent(@Body request: StudentCreateRequest): Response<Unit>

    @PUT("api/admin/students/{studentId}")
    suspend fun updateStudent(@Path("studentId") studentId: String, @Body request: StudentUpdateRequest): Response<Unit>

    @GET("api/admin/students")
    suspend fun getStudents(@Query("classId") classId: String? = null): Response<StudentsResponse>
    
    @GET("api/admin/classes")
    suspend fun getClasses(): Response<ClassesResponse>

    @POST("api/admin/classes")
    suspend fun createClass(@Body request: ClassCreateRequest): Response<com.folushovictory.schools.models.Class>

    @PUT("api/admin/classes/{classId}")
    suspend fun updateClass(@Path("classId") classId: String, @Body request: ClassUpdateRequest): Response<com.folushovictory.schools.models.Class>

    @GET("api/admin/subjects")
    suspend fun getSubjects(): Response<SubjectsResponse>

    @GET("api/config/school")
    suspend fun getSchoolSettings(): Response<SchoolSettings>

    @POST("api/admin/school-settings")
    suspend fun saveSchoolSettings(@Body request: SchoolSettings): Response<SchoolSettings>

    @POST("api/admin/term-meta")
    suspend fun setTermMeta(@Body request: TermMetaRequest): Response<Unit>

    @POST("api/admin/publish-results")
    suspend fun publishResults(@Body request: PublishResultsRequest): Response<Unit>

    @GET("api/admin/grading-scale")
    suspend fun getGradingScale(): Response<GradingScaleResponse>

    @POST("api/admin/grading-scale")
    suspend fun setGradingScale(@Body request: GradingScaleRequest): Response<GradingScaleResponse>

    @POST("api/admin/assignments")
    suspend fun createAdminAssignments(@Body request: AdminAssignmentRequest): Response<AssignmentsActionResponse>

    @POST("api/admin/remarks/principal")
    suspend fun setPrincipalRemark(@Body request: com.folushovictory.schools.models.PrincipalRemarkRequest): Response<Unit>

    @POST("api/admin/remarks/teacher")
    suspend fun setTeacherRemark(@Body request: com.folushovictory.schools.models.TeacherRemarkRequest): Response<Unit>
    
    @GET("api/teacher/assignments")
    suspend fun getTeacherAssignments(): Response<AssignmentsResponse>
    
    @GET("api/teacher/form-classes")
    suspend fun getTeacherFormClasses(): Response<ClassesResponse>

    @GET("api/teacher/dashboard")
    suspend fun getTeacherDashboard(): Response<TeacherDashboardData>
 
    @GET("api/teacher/classes/{classId}/students")
    suspend fun getClassStudents(@Path("classId") classId: String): Response<StudentsResponse>

    @GET("api/teacher/classes/{classId}/scores")
    suspend fun getClassScores(
        @Path("classId") classId: String,
        @retrofit2.http.Query("session") session: String,
        @retrofit2.http.Query("term") term: String,
        @retrofit2.http.Query("subjectId") subjectId: String
    ): Response<ScoreListResponse>
    
    @POST("api/teacher/scores")
    suspend fun saveScores(@Body request: ScoresRequest): Response<Unit>

    @GET("api/admin/classes/{classId}/scores")
    suspend fun getAdminClassScores(
        @Path("classId") classId: String,
        @retrofit2.http.Query("session") session: String,
        @retrofit2.http.Query("term") term: String,
        @retrofit2.http.Query("subjectId") subjectId: String
    ): Response<ScoreListResponse>

    @POST("api/admin/scores")
    suspend fun saveAdminScores(@Body request: ScoresRequest): Response<Unit>

    @GET("api/parent/student")
    suspend fun getParentStudent(): Response<Student>

    @GET("api/admin/activity-logs")
    suspend fun getActivityLogs(
        @retrofit2.http.Query("teacher") teacher: String? = null,
        @retrofit2.http.Query("limit") limit: Int = 25
    ): Response<com.folushovictory.schools.models.ActivityLogsResponse>

    @DELETE("api/admin/activity-logs/{id}")
    suspend fun deleteActivityLog(@Path("id") id: String): Response<com.google.gson.JsonObject>

    @DELETE("api/admin/activity-logs")
    suspend fun clearActivityLogs(): Response<com.google.gson.JsonObject>

    @GET("api/results/student/{studentId}/report")
    suspend fun getStudentReport(
        @Path("studentId") studentId: String,
        @retrofit2.http.Query("session") session: String,
        @retrofit2.http.Query("term") term: String
    ): Response<StudentReportResponse>

    @GET("api/results/class/{classId}/broadsheet")
    suspend fun getClassBroadsheet(
        @Path("classId") classId: String,
        @Query("session") session: String,
        @Query("term") term: String
    ): Response<com.google.gson.JsonObject>

    // Additional endpoints used by the web frontend but missing from Android client
    @GET("api/admin/students/{studentId}/scores")
    suspend fun getStudentScores(
        @Path("studentId") studentId: String,
        @Query("session") session: String? = null,
        @Query("term") term: String? = null
    ): Response<com.google.gson.JsonObject>

    @POST("api/admin/students/{studentId}/scores")
    suspend fun postStudentScores(@Path("studentId") studentId: String, @Body body: com.google.gson.JsonObject): Response<com.google.gson.JsonObject>

    @POST("api/teacher/students")
    suspend fun createTeacherStudent(@Body body: com.google.gson.JsonObject): Response<com.google.gson.JsonObject>

    @POST("api/teacher/remarks")
    suspend fun postTeacherRemark(@Body body: com.google.gson.JsonObject): Response<com.google.gson.JsonObject>

    @POST("api/teacher/results/release")
    suspend fun releaseTeacherResult(@Body body: com.google.gson.JsonObject): Response<com.google.gson.JsonObject>

    @GET("api/results/class/{classId}/report-students")
    suspend fun getReportStudents(@Path("classId") classId: String): Response<com.google.gson.JsonObject>

    @POST("api/results/class/{classId}/bulk-reports")
    suspend fun generateBulkReports(@Path("classId") classId: String, @Body body: com.google.gson.JsonObject): Response<com.google.gson.JsonObject>

    @POST("api/results/class/{classId}/notify-parents")
    suspend fun notifyParents(@Path("classId") classId: String, @Body body: com.google.gson.JsonObject): Response<com.google.gson.JsonObject>

    @POST("api/admin/teachers/{username}/resend-credentials")
    suspend fun resendTeacherCredentials(@Path("username") username: String): Response<com.google.gson.JsonObject>

    @POST("api/change-password")
    suspend fun changePassword(@Body body: com.folushovictory.schools.models.ChangePasswordRequest): Response<com.google.gson.JsonObject>

    @GET("api/config/sessions")
    suspend fun getAvailableSessions(): Response<AvailableSessionsResponse>

    @GET("api/parent/dashboard")
    suspend fun getParentDashboard(): Response<com.folushovictory.schools.models.ParentDashboardData>

    @POST("api/auth/password-reset")
    suspend fun requestPasswordReset(@Body request: PasswordResetRequest): Response<GenericApiResponse>

    @POST("api/auth/verify-recovery-code")
    suspend fun verifyRecoveryCode(@Body request: VerifyRecoveryCodeRequest): Response<GenericApiResponse>

    @POST("api/auth/reset-password")
    suspend fun resetPassword(@Body request: ResetPasswordRequest): Response<GenericApiResponse>
}
