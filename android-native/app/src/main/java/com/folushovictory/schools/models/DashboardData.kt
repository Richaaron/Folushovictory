package com.folushovictory.schools.models

data class DashboardData(
    val counts: Counts? = null,
    val avgPerformance: Double? = null,
    val activeTerm: ActiveTerm? = null
)

data class Counts(
    val students: Int? = null,
    val teachers: Int? = null,
    val classes: Int? = null
)

data class ActiveTerm(
    val session: String? = null,
    val term: String? = null
)
