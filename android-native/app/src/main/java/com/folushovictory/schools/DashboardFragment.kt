package com.folushovictory.schools

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageButton
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.folushovictory.schools.api.RetrofitClient
import com.folushovictory.schools.models.ActivityLog
import com.folushovictory.schools.models.ActivityLogsResponse
import kotlinx.coroutines.launch

class DashboardFragment : Fragment() {
    private lateinit var tvActiveSession: TextView
    private lateinit var tvCurrentTerm: TextView
    private lateinit var tvHealthLabel: TextView
    private lateinit var healthIndicator: ProgressBar
    private lateinit var tvStudentCount: TextView
    private lateinit var tvTeacherCount: TextView
    private lateinit var tvClassCount: TextView
    private lateinit var tvPendingCount: TextView
    private lateinit var btnRefresh: ImageButton
    private lateinit var btnSystemConfig: com.google.android.material.button.MaterialButton
    private lateinit var btnDataMgmt: com.google.android.material.button.MaterialButton
    private lateinit var rvRecentActivity: RecyclerView
    private lateinit var alertsContainer: LinearLayout
    private lateinit var loadingOverlay: View

    private val recentLogs = mutableListOf<ActivityLog>()
    private lateinit var recentActivityAdapter: RecentActivityAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_admin_dashboard_enhanced, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        tvActiveSession = view.findViewById(R.id.tvActiveSession)
        tvCurrentTerm = view.findViewById(R.id.tvCurrentTerm)
        tvHealthLabel = view.findViewById(R.id.tvHealthLabel)
        healthIndicator = view.findViewById(R.id.healthIndicator)
        tvStudentCount = view.findViewById(R.id.tvStudentCount)
        tvTeacherCount = view.findViewById(R.id.tvTeacherCount)
        tvClassCount = view.findViewById(R.id.tvClassCount)
        tvPendingCount = view.findViewById(R.id.tvPendingCount)
        btnRefresh = view.findViewById(R.id.btnRefresh)
        btnSystemConfig = view.findViewById(R.id.btnSystemConfig)
        btnDataMgmt = view.findViewById(R.id.btnDataMgmt)
        rvRecentActivity = view.findViewById(R.id.rvRecentActivity)
        alertsContainer = view.findViewById(R.id.alertsContainer)
        loadingOverlay = view.findViewById(R.id.loadingOverlay)

        rvRecentActivity.layoutManager = LinearLayoutManager(requireContext())
        recentActivityAdapter = RecentActivityAdapter(recentLogs)
        rvRecentActivity.adapter = recentActivityAdapter

        btnRefresh.setOnClickListener {
            loadDashboardData()
            loadRecentActivity()
        }

        btnSystemConfig.setOnClickListener {
            Toast.makeText(requireContext(), "System configuration coming soon", Toast.LENGTH_SHORT).show()
        }

        btnDataMgmt.setOnClickListener {
            Toast.makeText(requireContext(), "Data management coming soon", Toast.LENGTH_SHORT).show()
        }

        loadDashboardData()
        loadRecentActivity()
    }

    private fun loadDashboardData() {
        showLoading(true)
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.api.getAdminDashboard()
                if (response.isSuccessful && response.body() != null) {
                    displayDashboardData(response.body()!!)
                } else {
                    Toast.makeText(requireContext(), "Failed to load dashboard", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                showLoading(false)
            }
        }
    }

    private fun loadRecentActivity() {
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.api.getActivityLogs(null, 5)
                if (response.isSuccessful && response.body() != null) {
                    val body: ActivityLogsResponse = response.body()!!
                    recentLogs.clear()
                    recentLogs.addAll(body.logs)
                    recentActivityAdapter.notifyDataSetChanged()
                    displaySystemAlerts(body.logs)
                }
            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Could not load recent activity", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun displayDashboardData(data: com.folushovictory.schools.models.DashboardData) {
        tvActiveSession.text = data.activeTerm?.session ?: "2025/2026"
        tvCurrentTerm.text = data.activeTerm?.term ?: "Second Term"
        tvStudentCount.text = data.counts?.students?.toString() ?: "0"
        tvTeacherCount.text = data.counts?.teachers?.toString() ?: "0"
        tvClassCount.text = data.counts?.classes?.toString() ?: "0"
        tvPendingCount.text = "3"
        val health = 84
        healthIndicator.progress = health
        tvHealthLabel.text = if (health >= 85) "Operating Normally" else "Attention Required"
        tvHealthLabel.setTextColor(
            resources.getColor(
                if (health >= 85) R.color.success else if (health >= 65) R.color.warning else R.color.error,
                requireContext().theme
            )
        )
    }

    private fun displaySystemAlerts(logs: List<ActivityLog>) {
        alertsContainer.removeAllViews()
        if (logs.isEmpty()) {
            alertsContainer.visibility = View.GONE
            return
        }

        val alert = TextView(requireContext()).apply {
            text = "${logs.size} recent school events loaded"
            setTextColor(resources.getColor(R.color.text_white, requireContext().theme))
            textSize = 13f
            setPadding(14, 10, 14, 10)
            setBackgroundResource(R.drawable.card_bg_gradient)
        }

        alertsContainer.addView(alert)
        alertsContainer.visibility = View.VISIBLE
    }

    private fun showLoading(isLoading: Boolean) {
        loadingOverlay.visibility = if (isLoading) View.VISIBLE else View.GONE
    }
}
