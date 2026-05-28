package com.folushovictory.schools.models

data class Assignment(
    val id: String,
    val teacherUsername: String,
    val classId: String,
    val subjectId: String,
    val className: String? = null,
    val subjectName: String? = null,
    val level: String? = null,
    val createdAt: String? = null
)

data class AssignmentsResponse(
    val assignments: List<Assignment>
)
