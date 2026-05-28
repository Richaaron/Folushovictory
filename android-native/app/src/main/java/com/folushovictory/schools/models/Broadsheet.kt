package com.folushovictory.schools.models

data class BroadsheetSubject(
    val id: String = "",
    val name: String = "",
    val track: String? = null,
    val level: String? = null
)

data class PerSubjectScore(
    val subjectId: String = "",
    val subjectName: String = "",
    val ca1: Double? = null,
    val ca2: Double? = null,
    val ca: Double? = null,
    val exam: Double? = null,
    val total: Double? = null,
    val grade: String? = null,
    val remark: String? = null,
    val subjectPosition: Int? = null
)

data class BroadsheetStudent(
    val studentId: String = "",
    val firstName: String = "",
    val lastName: String = "",
    val perSubject: List<PerSubjectScore> = emptyList(),
    val total: Double? = null,
    val average: Double? = null,
    val position: Int? = null
)

data class BroadsheetResponse(
    val school: Map<String, Any>? = null,
    val classInfo: Map<String, Any>? = null,
    val session: String = "",
    val term: String = "",
    val published: Boolean = false,
    val subjects: List<BroadsheetSubject> = emptyList(),
    val students: List<BroadsheetStudent> = emptyList()
)
