package com.folushovictory.schools.models

data class Score(
    val studentId: String,
    val ca1: Double? = null,
    val ca2: Double? = null,
    val exam: Double? = null
)

data class ScoresRequest(
    val session: String,
    val term: String,
    val classId: String,
    val subjectId: String,
    val scores: List<Score>
)
