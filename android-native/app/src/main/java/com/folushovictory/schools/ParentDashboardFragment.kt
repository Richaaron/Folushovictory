package com.folushovictory.schools

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.ProgressBar
import android.widget.Spinner
import android.widget.TextView
import android.widget.Toast
import android.widget.AdapterView
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.folushovictory.schools.api.RetrofitClient
import com.folushovictory.schools.models.FeeStatus
import com.folushovictory.schools.models.ReportCard
import com.folushovictory.schools.models.Student
import com.folushovictory.schools.models.StudentInfo
import kotlinx.coroutines.launch

class ParentDashboardFragment : Fragment() {
    private lateinit var progressBar: ProgressBar
    private lateinit var contentGroup: View
    private lateinit var spinnerChildSelect: Spinner
    private lateinit var tvChildClass: TextView
    private lateinit var tvCurrentGPA: TextView
    private lateinit var rvReportCards: RecyclerView
    private lateinit var tvTotalOwing: TextView
    private lateinit var tvTotalPaid: TextView
    private lateinit var btnPayFees: Button
    private lateinit var buttonViewReport: Button

    private lateinit var reportCardAdapter: ReportCardAdapter
    private lateinit var currentFeeStatus: FeeStatus
    private var children = listOf<StudentInfo>()
    private var selectedChildId: String? = null
    private var selectedChildName: String? = null

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_parent_dashboard_enhanced, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        progressBar = view.findViewById(R.id.parentDashboardProgress)
        contentGroup = view.findViewById(R.id.parentDashboardContent)
        spinnerChildSelect = view.findViewById(R.id.spinnerChildSelect)
        tvChildClass = view.findViewById(R.id.tvChildClass)
        tvCurrentGPA = view.findViewById(R.id.tvCurrentGPA)
        rvReportCards = view.findViewById(R.id.rvReportCards)
        tvTotalOwing = view.findViewById(R.id.tvTotalOwing)
        tvTotalPaid = view.findViewById(R.id.tvTotalPaid)
        btnPayFees = view.findViewById(R.id.btnPayFees)
        buttonViewReport = view.findViewById(R.id.buttonViewReport)

        rvReportCards.layoutManager = LinearLayoutManager(requireContext())
        reportCardAdapter = ReportCardAdapter(emptyList())
        rvReportCards.adapter = reportCardAdapter

        spinnerChildSelect.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>, view: View?, position: Int, id: Long) {
                if (children.isNotEmpty()) {
                    val selected = children[position]
                    selectedChildId = selected.studentId
                    selectedChildName = selected.name
                    tvChildClass.text = selected.classLevel
                    tvCurrentGPA.text = selected.currentGPA?.toString() ?: "--"
                    loadReportCards(selected)
                }
            }

            override fun onNothingSelected(parent: AdapterView<*>) {}
        }

        btnPayFees.setOnClickListener {
            Toast.makeText(requireContext(), "Redirecting to fee payment...", Toast.LENGTH_SHORT).show()
        }

        buttonViewReport.setOnClickListener {
            selectedChildId?.let {
                parentFragmentManager.beginTransaction()
                    .replace(R.id.fragmentContainer, StudentReportFragment.newInstance(it, null, null))
                    .addToBackStack(null)
                    .commit()
            }
        }

        loadParentStudent()
    }

    private fun loadParentStudent() {
        lifecycleScope.launch {
            showLoading(true)
            try {
                val response = RetrofitClient.api.getParentStudent()
                if (response.isSuccessful && response.body() != null) {
                    response.body()?.let(this@ParentDashboardFragment::displayStudent)
                }
            } catch (error: Exception) {
                Toast.makeText(requireContext(), "Error loading student: ${error.message}", Toast.LENGTH_SHORT).show()
            } finally {
                showLoading(false)
            }
        }
    }

    private fun displayStudent(student: Student) {
        selectedChildId = student.studentId
        selectedChildName = "${student.firstName} ${student.lastName}"

        children = listOf(
            StudentInfo(
                studentId = student.studentId,
                name = selectedChildName ?: "Child",
                classLevel = student.classId ?: "N/A",
                classId = student.classId ?: "",
                admissionNumber = student.studentId,
                currentGPA = 3.9
            )
        )

        val adapter = ArrayAdapter(requireContext(), android.R.layout.simple_spinner_item, children.map { it.name })
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        spinnerChildSelect.adapter = adapter

        val child = children.first()
        tvChildClass.text = child.classLevel
        tvCurrentGPA.text = child.currentGPA?.toString() ?: "--"
        loadReportCards(child)
        updateFeeStatus(
            FeeStatus(
                totalDue = 15200.0,
                totalPaid = 8200.0,
                totalOwing = 7000.0,
                outstandingTerms = 1
            )
        )
    }

    private fun loadReportCards(child: StudentInfo) {
        val reports = listOf(
            ReportCard(
                reportId = "r1",
                studentId = child.studentId,
                session = "2025/2026",
                term = "Second Term",
                releaseDate = System.currentTimeMillis(),
                subjects = 8,
                averageGrade = "A",
                position = "1st",
                status = "released"
            ),
            ReportCard(
                reportId = "r2",
                studentId = child.studentId,
                session = "2024/2025",
                term = "Third Term",
                releaseDate = System.currentTimeMillis() - 90L * 24 * 3600 * 1000,
                subjects = 8,
                averageGrade = "A-",
                position = "2nd",
                status = "released"
            )
        )
        rvReportCards.adapter = ReportCardAdapter(reports)
    }

    private fun updateFeeStatus(feeStatus: FeeStatus) {
        currentFeeStatus = feeStatus
        tvTotalOwing.text = String.format("₦%,.0f", feeStatus.totalOwing)
        tvTotalPaid.text = String.format("₦%,.0f", feeStatus.totalPaid)
        btnPayFees.visibility = if (feeStatus.totalOwing > 0) View.VISIBLE else View.GONE
    }

    private fun showLoading(isLoading: Boolean) {
        progressBar.visibility = if (isLoading) View.VISIBLE else View.GONE
        contentGroup.visibility = if (isLoading) View.GONE else View.VISIBLE
    }
}
