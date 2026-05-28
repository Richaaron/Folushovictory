package com.folushovictory.schools.models

data class Teacher(
    val username: String,
    val displayName: String,
    val email: String? = null,
    val assignedSubjectIds: List<String>? = null,
    val selectedClassIds: List<String>? = null,
    val formClassId: String? = null
)

data class TeachersResponse(
    val teachers: List<Teacher>
)
