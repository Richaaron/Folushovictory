package com.folushovictory.schools.models

data class Class(
    val id: String,
    val name: String,
    val level: String,
    val track: String? = null,
    val assessmentType: String? = null,
    val formTeacherUsername: String? = null,
    val subjectIds: List<String>? = null
)

data class ClassesResponse(
    val classes: List<Class>
)
