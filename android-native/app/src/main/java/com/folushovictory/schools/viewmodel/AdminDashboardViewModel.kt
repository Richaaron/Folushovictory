package com.folushovictory.schools.viewmodel

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.folushovictory.schools.api.RetrofitClient
import com.folushovictory.schools.models.DashboardStats
import com.folushovictory.schools.models.SystemAlert
import com.folushovictory.schools.models.AlertType
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * AdminDashboardViewModel: Manages admin dashboard data and UI state
 */
class AdminDashboardViewModel : ViewModel() {
    
    private val _dashboardStats = MutableLiveData<DashboardStats>()
    val dashboardStats: LiveData<DashboardStats> = _dashboardStats
    
    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading
    
    private val _errorMessage = MutableLiveData<String>()
    val errorMessage: LiveData<String> = _errorMessage
    
    private val _selectedSession = MutableLiveData<String>()
    val selectedSession: LiveData<String> = _selectedSession
    
    private val _availableSessions = MutableLiveData<List<String>>()
    val availableSessions: LiveData<List<String>> = _availableSessions
    
    init {
        fetchDashboardData()
        fetchAvailableSessions()
    }
    
    fun fetchDashboardData() {
        _isLoading.value = true
        viewModelScope.launch(Dispatchers.IO) {
            try {
                val response = RetrofitClient.api.getAdminDashboard()
                val responseBody = response.body()
                
                if (response.isSuccessful && responseBody != null) {
                    val mappedStats = DashboardStats(
                        studentCount = responseBody.counts?.students ?: 0,
                        teacherCount = responseBody.counts?.teachers ?: 0,
                        classCount = responseBody.counts?.classes ?: 0,
                        activeSession = responseBody.activeTerm?.session.orEmpty(),
                        currentTerm = responseBody.activeTerm?.term.orEmpty(),
                        recentActivityCount = 0,
                        pendingApprovals = 0,
                        systemAlerts = emptyList()
                    )
                    _dashboardStats.postValue(mappedStats)
                    _selectedSession.postValue(responseBody.activeTerm?.session)
                    _errorMessage.postValue("")
                } else {
                    _errorMessage.postValue("Failed to load dashboard")
                    _dashboardStats.postValue(createMockStats())
                }
            } catch (e: Exception) {
                _errorMessage.postValue("Error: ${e.message}")
                // Post mock data for preview
                _dashboardStats.postValue(createMockStats())
            } finally {
                _isLoading.postValue(false)
            }
        }
    }
    
    fun fetchAvailableSessions() {
        viewModelScope.launch(Dispatchers.IO) {
            try {
                val response = RetrofitClient.api.getAvailableSessions()
                if (response.isSuccessful && response.body()?.data != null) {
                    _availableSessions.postValue(response.body()!!.data)
                } else {
                    _availableSessions.postValue(listOf("2025/2026"))
                }
            } catch (e: Exception) {
                _availableSessions.postValue(listOf("2025/2026"))
            }
        }
    }
    
    fun selectSession(session: String) {
        _selectedSession.value = session
        fetchDashboardData()
    }
    
    fun dismissAlert(alertId: String) {
        val currentStats = _dashboardStats.value ?: return
        val updatedAlerts = currentStats.systemAlerts.filterNot { it.id == alertId }
        _dashboardStats.value = currentStats.copy(systemAlerts = updatedAlerts)
    }
    
    private fun createMockStats(): DashboardStats {
        return DashboardStats(
            studentCount = 289,
            teacherCount = 22,
            classCount = 14,
            systemHealth = 84,
            activeSession = "2025/2026",
            currentTerm = "Second Term",
            recentActivityCount = 47,
            pendingApprovals = 3,
            systemAlerts = listOf(
                SystemAlert(
                    id = "alert1",
                    type = AlertType.INFO,
                    title = "System Update",
                    message = "Database backup completed successfully",
                    timestamp = System.currentTimeMillis()
                ),
                SystemAlert(
                    id = "alert2",
                    type = AlertType.WARNING,
                    title = "Action Needed",
                    message = "3 pending teacher score submissions",
                    timestamp = System.currentTimeMillis() - 3600000
                )
            )
        )
    }
}
