package com.folushovictory.schools.models

data class Student(
    val studentId: String,
    val firstName: String,
    val lastName: String,
    val gender: String? = null,
    val classId: String? = null,
    val parentName: String? = null,
    val parentEmail: String? = null,
    val stream: String? = null,
    val subjectIds: List<String>? = null
)

data class StudentsResponse(
    val students: List<Student>
)
