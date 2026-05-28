package com.folushovictory.schools.models

data class ActivityLog(
    val id: String = "",
    val actor: String = "",
    val role: String = "",
    val action: String = "",
    val details: Map<String, Any>? = null,
    val resourceType: String? = null,
    val resourceId: String? = null,
    val createdAt: String? = null
)

data class ActivityLogsResponse(
    val logs: List<ActivityLog> = emptyList()
)
