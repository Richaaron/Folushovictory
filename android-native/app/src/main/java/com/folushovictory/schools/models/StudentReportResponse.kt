package com.folushovictory.schools.models

import com.google.gson.annotations.SerializedName

data class StudentReportResponse(
    val student: Student,
    @SerializedName("class") val studentClass: StudentClassInfo?,
    val school: SchoolInfo?,
    val formTeacher: TeacherInfo?,
    val result: ResultSummary?,
    val term: String?,
    val session: String?,
    val released: Boolean?,
    val teacherRemark: String?,
    val principalRemark: String?,
    val cumulative: CumulativeRecord?
)

data class StudentClassInfo(
    val name: String?,
    val level: String?
)

data class SchoolInfo(
    val name: String?,
    val motto: String?,
    val address: String?,
    val phone: String?,
    val email: String?,
    val website: String?,
    val logoUrl: String?,
    val principalName: String?,
    val principalSignatureUrl: String?
)

data class TeacherInfo(
    val displayName: String?
)

data class ResultSummary(
    val total: Int?,
    val average: Double?,
    val position: Int?,
    val overallGrade: String?,
    val perSubject: List<SubjectReportRow>?
)

data class SubjectReportRow(
    val subjectId: String?,
    val subjectName: String?,
    val ca1: Int?,
    val ca2: Int?,
    val exam: Int?,
    val total: Int?,
    val grade: String?,
    val remark: String?
)

data class CumulativeRecord(
    val previousTerms: List<PreviousTerm>?,
    val sessionAverage: Double?,
    val sessionTotal: Int?
)

data class PreviousTerm(
    val term: String?,
    val average: Double?,
    val total: String?
)
