package com.folushovictory.schools.viewmodel

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.folushovictory.schools.api.RetrofitClient
import com.folushovictory.schools.models.TeacherDashboardData
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * TeacherDashboardViewModel: Manages teacher dashboard data
 */
class TeacherDashboardViewModel : ViewModel() {
    
    private val _dashboardData = MutableLiveData<TeacherDashboardData>()
    val dashboardData: LiveData<TeacherDashboardData> = _dashboardData
    
    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading
    
    private val _errorMessage = MutableLiveData<String>()
    val errorMessage: LiveData<String> = _errorMessage
    
    private val _selectedClassId = MutableLiveData<String>()
    val selectedClassId: LiveData<String> = _selectedClassId
    
    init {
        fetchTeacherDashboard()
    }
    
    fun fetchTeacherDashboard() {
        _isLoading.value = true
        viewModelScope.launch(Dispatchers.IO) {
            try {
                val response = RetrofitClient.api.getTeacherDashboard()
                val responseBody = response.body()
                
                if (response.isSuccessful && responseBody != null) {
                    _dashboardData.postValue(responseBody)
                    if (responseBody.assignedClasses.isNotEmpty()) {
                        _selectedClassId.postValue(responseBody.assignedClasses[0].classId)
                    }
                    _errorMessage.postValue("")
                } else {
                    _errorMessage.postValue("Failed to load dashboard")
                }
            } catch (e: Exception) {
                _errorMessage.postValue("Error: ${e.message}")
            } finally {
                _isLoading.postValue(false)
            }
        }
    }
    
    fun selectClass(classId: String) {
        _selectedClassId.value = classId
    }
    
    fun refreshData() {
        fetchTeacherDashboard()
    }
}
