package com.folushovictory.schools.viewmodel

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.folushovictory.schools.api.RetrofitClient
import com.folushovictory.schools.models.ParentDashboardData
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * ParentDashboardViewModel: Manages parent portal dashboard
 */
class ParentDashboardViewModel : ViewModel() {
    
    private val _dashboardData = MutableLiveData<ParentDashboardData>()
    val dashboardData: LiveData<ParentDashboardData> = _dashboardData
    
    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading
    
    private val _errorMessage = MutableLiveData<String>()
    val errorMessage: LiveData<String> = _errorMessage
    
    private val _selectedChildId = MutableLiveData<String>()
    val selectedChildId: LiveData<String> = _selectedChildId
    
    init {
        fetchParentDashboard()
    }
    
    fun fetchParentDashboard() {
        _isLoading.value = true
        viewModelScope.launch(Dispatchers.IO) {
            try {
                val response = RetrofitClient.api.getParentDashboard()
                val responseBody = response.body()
                
                if (response.isSuccessful && responseBody != null) {
                    _dashboardData.postValue(responseBody)
                    if (responseBody.children.isNotEmpty()) {
                        _selectedChildId.postValue(responseBody.children[0].studentId)
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
    
    fun selectChild(childId: String) {
        _selectedChildId.value = childId
        val currentData = _dashboardData.value ?: return
        val selectedChild = currentData.children.find { it.studentId == childId }
        _dashboardData.value = currentData.copy(
            selectedChildId = childId,
            selectedChildName = selectedChild?.name
        )
    }
    
    fun refreshData() {
        fetchParentDashboard()
    }
}
