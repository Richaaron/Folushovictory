package com.folushovictory.schools.models

/**
 * Dashboard Stats Models
 */

data class DashboardStats(
    val studentCount: Int = 0,
    val teacherCount: Int = 0,
    val classCount: Int = 0,
    val systemHealth: Int = 100, // 0-100 percentage
    val activeSession: String = "",
    val currentTerm: String = "",
    val recentActivityCount: Int = 0,
    val pendingApprovals: Int = 0,
    val systemAlerts: List<SystemAlert> = emptyList()
)

data class SystemAlert(
    val id: String,
    val type: AlertType, // INFO, WARNING, ERROR, SUCCESS
    val title: String,
    val message: String,
    val timestamp: Long,
    val actionText: String? = null,
    val actionRoute: String? = null
)

enum class AlertType {
    INFO, WARNING, ERROR, SUCCESS
}

data class StatCard(
    val label: String,
    val value: String,
    val icon: String, // emoji or drawable name
    val color: String, // hex color
    val trend: Int? = null, // positive/negative percentage change
    val onClick: String? = null // navigation route
)

data class TeacherDashboardData(
    val userName: String = "",
    val assignedClasses: List<ClassInfo> = emptyList(),
    val recentSubmissions: List<Submission> = emptyList(),
    val currentSession: String = "",
    val currentTerm: String = "",
    val totalStudents: Int = 0
)

data class ClassInfo(
    val classId: String,
    val className: String,
    val studentCount: Int,
    val level: String,
    val formTeacher: String
)

data class Submission(
    val id: String,
    val className: String,
    val subject: String,
    val type: String, // "scores", "grades", "attendance"
    val timestamp: Long,
    val status: String // "submitted", "pending", "approved"
)

data class ParentDashboardData(
    val parentName: String = "",
    val children: List<StudentInfo> = emptyList(),
    val selectedChildId: String? = null,
    val selectedChildName: String? = null,
    val recentReports: List<ReportCard> = emptyList(),
    val feeStatus: FeeStatus? = null,
    val attendanceSummary: AttendanceSummary? = null
)

data class StudentInfo(
    val studentId: String,
    val name: String,
    val classLevel: String,
    val classId: String,
    val admissionNumber: String,
    val currentGPA: Double? = null
)

data class ReportCard(
    val reportId: String,
    val studentId: String,
    val session: String, // "2025/2026"
    val term: String, // "First", "Second", "Third"
    val releaseDate: Long,
    val subjects: Int,
    val averageGrade: String,
    val position: String?,
    val status: String // "released", "pending", "draft"
)

data class FeeStatus(
    val totalDue: Double = 0.0,
    val totalPaid: Double = 0.0,
    val totalOwing: Double = 0.0,
    val paymentDueDate: Long? = null,
    val outstandingTerms: Int = 0,
    val lastPaymentDate: Long? = null
)

data class AttendanceSummary(
    val presentDays: Int = 0,
    val absentDays: Int = 0,
    val percentage: Double = 0.0,
    val schoolYear: String = "",
    val term: String = ""
)
