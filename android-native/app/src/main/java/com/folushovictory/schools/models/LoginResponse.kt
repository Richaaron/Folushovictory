package com.folushovictory.schools.models

data class LoginResponse(
    val token: String,
    val user: User
)
