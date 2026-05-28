# Native Android App for Folusho Victory Schools

This guide will help you set up a completely native Android application (in Kotlin) that connects to your existing backend, without modifying your current codebase.

## Prerequisites
1. Android Studio (latest version)
2. JDK 11 or later
3. Android SDK (API level 26 or later)

## Step 1: Create a New Android Project

1. Open Android Studio
2. Click **New Project**
3. Select **Empty Views Activity** (or **Empty Compose Activity** if you prefer Jetpack Compose)
4. Click **Next**
5. Fill in the project details:
   - **Name**: Folusho Victory Schools
   - **Package name**: com.folushovictory.schools
   - **Save location**: `c:\Users\PASTOR\Desktop\Build IT\android-native\app`
   - **Language**: Kotlin
   - **Minimum SDK**: API 26 (Android 8.0)
6. Click **Finish**

## Step 2: Add Dependencies

Add the following dependencies to your `app/build.gradle.kts` (Module level):

```kotlin
dependencies {
    // Retrofit for API calls
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
    
    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
    
    // ViewModel and LiveData
    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.6.2")
    implementation("androidx.lifecycle:lifecycle-livedata-ktx:2.6.2")
    implementation("androidx.activity:activity-ktx:1.8.1")
    
    // Material Design
    implementation("com.google.android.material:material:1.11.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")
}
```

Also, add internet permission to your `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.INTERNET" />
```

## Step 3: Set Up Retrofit API Client

Create a new package `com.folushovictory.schools.api` and add these files:

### 1. `RetrofitClient.kt`
```kotlin
package com.folushovictory.schools.api

import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object RetrofitClient {
    private const val BASE_URL = "https://folushovictory-backend.onrender.com/"
    
    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }
    
    private val okHttpClient = OkHttpClient.Builder()
        .addInterceptor(loggingInterceptor)
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()
    
    val api: ApiService by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }
}
```

### 2. `ApiService.kt`
```kotlin
package com.folushovictory.schools.api

import com.folushovictory.schools.models.LoginRequest
import com.folushovictory.schools.models.LoginResponse
import com.folushovictory.schools.models.User
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Header

interface ApiService {
    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>
    
    @GET("api/me")
    suspend fun getCurrentUser(@Header("Authorization") token: String): Response<User>
}
```

## Step 4: Create Data Models

Create package `com.folushovictory.schools.models` and add these files:

### 1. `LoginRequest.kt`
```kotlin
package com.folushovictory.schools.models

data class LoginRequest(
    val email: String,
    val password: String
)
```

### 2. `LoginResponse.kt`
```kotlin
package com.folushovictory.schools.models

data class LoginResponse(
    val token: String,
    val user: User
)
```

### 3. `User.kt`
```kotlin
package com.folushovictory.schools.models

data class User(
    val id: String,
    val email: String,
    val name: String,
    val role: String
)
```

## Step 5: Create Repository

Create package `com.folushovictory.schools.repository` and add:

### `AuthRepository.kt`
```kotlin
package com.folushovictory.schools.repository

import com.folushovictory.schools.api.RetrofitClient
import com.folushovictory.schools.models.LoginRequest
import com.folushovictory.schools.models.LoginResponse

class AuthRepository {
    suspend fun login(email: String, password: String): Result<LoginResponse> {
        return try {
            val response = RetrofitClient.api.login(LoginRequest(email, password))
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
```

## Step 6: Create ViewModel

Create package `com.folushovictory.schools.viewmodel` and add:

### `LoginViewModel.kt`
```kotlin
package com.folushovictory.schools.viewmodel

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.folushovictory.schools.repository.AuthRepository
import kotlinx.coroutines.launch

class LoginViewModel : ViewModel() {
    private val repository = AuthRepository()
    
    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading
    
    private val _loginSuccess = MutableLiveData<Boolean>()
    val loginSuccess: LiveData<Boolean> = _loginSuccess
    
    private val _errorMessage = MutableLiveData<String>()
    val errorMessage: LiveData<String> = _errorMessage
    
    fun login(email: String, password: String) {
        if (email.isBlank() || password.isBlank()) {
            _errorMessage.value = "Please fill in all fields"
            return
        }
        
        viewModelScope.launch {
            _isLoading.value = true
            val result = repository.login(email, password)
            _isLoading.value = false
            
            if (result.isSuccess) {
                _loginSuccess.value = true
            } else {
                _errorMessage.value = result.exceptionOrNull()?.message ?: "Login failed"
            }
        }
    }
}
```

## Step 7: Create Login Screen

Create a login activity layout in `res/layout/activity_login.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="24dp"
    android:gravity="center"
    android:background="#F5F5F5">

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Folusho Victory Schools"
        android:textSize="24sp"
        android:textStyle="bold"
        android:textColor="#333333"
        android:layout_marginBottom="48dp" />

    <com.google.android.material.textfield.TextInputLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginBottom="16dp"
        android:hint="Email">

        <com.google.android.material.textfield.TextInputEditText
            android:id="@+id/etEmail"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:inputType="textEmailAddress" />
    </com.google.android.material.textfield.TextInputLayout>

    <com.google.android.material.textfield.TextInputLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginBottom="24dp"
        android:hint="Password">

        <com.google.android.material.textfield.TextInputEditText
            android:id="@+id/etPassword"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:inputType="textPassword" />
    </com.google.android.material.textfield.TextInputLayout>

    <com.google.android.material.button.MaterialButton
        android:id="@+id/btnLogin"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Login"
        android:textSize="16sp"
        android:paddingVertical="12dp" />

    <ProgressBar
        android:id="@+id/progressBar"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_marginTop="16dp"
        android:visibility="gone" />

</LinearLayout>
```

Create `LoginActivity.kt`:

```kotlin
package com.folushovictory.schools

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import com.folushovictory.schools.databinding.ActivityLoginBinding
import com.folushovictory.schools.viewmodel.LoginViewModel

class LoginActivity : AppCompatActivity() {
    private lateinit var binding: ActivityLoginBinding
    private val viewModel: LoginViewModel by viewModels()
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        setupObservers()
        setupClickListeners()
    }
    
    private fun setupObservers() {
        viewModel.isLoading.observe(this) { isLoading ->
            binding.progressBar.visibility = if (isLoading) View.VISIBLE else View.GONE
            binding.btnLogin.isEnabled = !isLoading
        }
        
        viewModel.loginSuccess.observe(this) { success ->
            if (success) {
                Toast.makeText(this, "Login successful!", Toast.LENGTH_SHORT).show()
                // Navigate to main activity
                val intent = Intent(this, MainActivity::class.java)
                startActivity(intent)
                finish()
            }
        }
        
        viewModel.errorMessage.observe(this) { message ->
            if (message.isNotBlank()) {
                Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
            }
        }
    }
    
    private fun setupClickListeners() {
        binding.btnLogin.setOnClickListener {
            val email = binding.etEmail.text.toString().trim()
            val password = binding.etPassword.text.toString().trim()
            viewModel.login(email, password)
        }
    }
}
```

## Step 8: Update AndroidManifest.xml

Set LoginActivity as the launcher activity:

```xml
<activity
    android:name=".LoginActivity"
    android:exported="true">
    <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
    </intent-filter>
</activity>
```

## Step 9: Build and Run

1. Sync Gradle files in Android Studio
2. Connect your Android device or start an emulator
3. Click the **Run** button (green triangle) in Android Studio

## Next Steps

Once the basic login screen is working, you can expand the app by:
- Adding more API endpoints to the ApiService
- Creating screens for different user roles (Admin, Teacher, Parent)
- Implementing student management features
- Adding result viewing functionality
- Implementing offline support with Room Database
- Adding push notifications

## Important Notes

- This native Android app is completely separate from your existing codebase - it won't affect your web app or backend
- The app uses the same backend API at https://folushovictory-backend.onrender.com/
- Make sure your backend's CORS settings are properly configured (they already are from previous fixes)
