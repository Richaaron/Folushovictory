package com.folushovictory.schools.viewmodel

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.folushovictory.schools.models.LoginResponse
import com.folushovictory.schools.repository.AuthRepository
import kotlinx.coroutines.launch

enum class Portal {
    ADMIN, TEACHER, PARENT
}

class LoginViewModel : ViewModel() {
    private val repository = AuthRepository()
    
    private val _selectedPortal = MutableLiveData<Portal>(Portal.ADMIN)
    val selectedPortal: LiveData<Portal> = _selectedPortal
    
    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading
    
    private val _loginSuccess = MutableLiveData<Boolean>()
    val loginSuccess: LiveData<Boolean> = _loginSuccess
    
    private val _user = MutableLiveData<LoginResponse?>()
    val user: LiveData<LoginResponse?> = _user
    
    private val _errorMessage = MutableLiveData<String>()
    val errorMessage: LiveData<String> = _errorMessage
    
    fun selectPortal(portal: Portal) {
        _selectedPortal.value = portal
    }
    
    fun login(username: String, password: String) {
        if (username.isBlank() || password.isBlank()) {
            _errorMessage.value = "Please fill in all fields"
            return
        }
        
        viewModelScope.launch {
            _isLoading.value = true
            val result = repository.login(
                _selectedPortal.value!!.name,
                username,
                password
            )
            _isLoading.value = false
            
            if (result.isSuccess) {
                _user.value = result.getOrNull()
            } else {
                _errorMessage.value = result.exceptionOrNull()?.message ?: "Login failed"
            }
        }
    }
}
