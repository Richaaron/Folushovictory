package com.folushovictory.schools.models

data class LoginRequest(
    val portal: String,
    val username: String,
    val password: String
)
