package com.folushovictory.schools.repository

import com.folushovictory.schools.api.RetrofitClient
import com.folushovictory.schools.models.LoginRequest
import com.folushovictory.schools.models.LoginResponse

class AuthRepository {
    suspend fun login(portal: String, username: String, password: String): Result<LoginResponse> {
        return try {
            val response = RetrofitClient.api.login(LoginRequest(portal.uppercase(), username, password))
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Login failed: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
