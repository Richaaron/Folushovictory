package com.folushovictory.schools

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.folushovictory.schools.api.RetrofitClient
import com.folushovictory.schools.models.Assignment
import com.folushovictory.schools.models.Class
import com.google.android.material.button.MaterialButton
import kotlinx.coroutines.launch

class TeacherDashboardFragment : Fragment() {
    private lateinit var tvTeacherName: TextView
    private lateinit var tvSessionTerm: TextView
    private lateinit var tvTotalStudents: TextView
    private lateinit var rvAssignedClasses: RecyclerView
    private lateinit var rvRecentSubmissions: RecyclerView
    private lateinit var btnScoreEntry: MaterialButton
    private lateinit var btnFormClass: MaterialButton
    private lateinit var progressBar: ProgressBar

    private var selectedAssignment: Assignment? = null
    private var selectedClass: Class? = null

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_teacher_dashboard_enhanced, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        tvTeacherName = view.findViewById(R.id.tvTeacherName)
        tvSessionTerm = view.findViewById(R.id.tvSessionTerm)
        tvTotalStudents = view.findViewById(R.id.tvTotalStudents)
        rvAssignedClasses = view.findViewById(R.id.rvAssignedClasses)
        rvRecentSubmissions = view.findViewById(R.id.rvRecentSubmissions)
        btnScoreEntry = view.findViewById(R.id.btnScoreEntry)
        btnFormClass = view.findViewById(R.id.btnFormClass)
        progressBar = view.findViewById(R.id.progressBar)

        rvAssignedClasses.layoutManager = LinearLayoutManager(requireContext())
        rvRecentSubmissions.layoutManager = LinearLayoutManager(requireContext())

        btnScoreEntry.setOnClickListener {
            selectedAssignment?.let { openScoreEntryForAssignment(it) }
                ?: Toast.makeText(requireContext(), "Select an assignment first", Toast.LENGTH_SHORT).show()
        }

        btnFormClass.setOnClickListener {
            selectedClass?.let { selectedClass ->
                Toast.makeText(requireContext(), "Form class: ${selectedClass.name}", Toast.LENGTH_SHORT).show()
            } ?: Toast.makeText(requireContext(), "No form class available", Toast.LENGTH_SHORT).show()
        }

        tvTeacherName.text = "Welcome, Teacher"
        loadTeacherPortalData()
    }

    private fun loadTeacherPortalData() {
        progressBar.visibility = View.VISIBLE
        lifecycleScope.launch {
            try {
                val assignmentsResponse = RetrofitClient.api.getTeacherAssignments()
                val formClassesResponse = RetrofitClient.api.getTeacherFormClasses()
                val schoolSettingsResponse = RetrofitClient.api.getSchoolSettings()

                if (schoolSettingsResponse.isSuccessful && schoolSettingsResponse.body() != null) {
                    val settings = schoolSettingsResponse.body()!!
                    val session = settings.currentSession ?: "Current Session"
                    val term = settings.currentTerm ?: "Current Term"
                    tvSessionTerm.text = "$session - $term"
                } else {
                    tvSessionTerm.text = "Current academic session"
                }

                if (formClassesResponse.isSuccessful && formClassesResponse.body() != null) {
                    val classes = formClassesResponse.body()!!.classes
                    tvTotalStudents.text = classes.size.toString()
                    rvAssignedClasses.adapter = ClassAdapter(classes) { selectedClass ->
                        this@TeacherDashboardFragment.selectedClass = selectedClass
                        Toast.makeText(requireContext(), "Form class: ${selectedClass.name}", Toast.LENGTH_SHORT).show()
                    }
                    selectedClass = classes.firstOrNull()
                } else {
                    tvTotalStudents.text = "0"
                    rvAssignedClasses.adapter = ClassAdapter(emptyList()) {}
                }

                if (assignmentsResponse.isSuccessful && assignmentsResponse.body() != null) {
                    val assignments = assignmentsResponse.body()!!.assignments
                    rvRecentSubmissions.adapter = AssignmentAdapter(assignments) { assignment ->
                        selectedAssignment = assignment
                        openScoreEntryForAssignment(assignment)
                    }
                    selectedAssignment = assignments.firstOrNull()
                } else {
                    rvRecentSubmissions.adapter = AssignmentAdapter(emptyList()) {}
                }
            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Error loading teacher portal: ${e.message}", Toast.LENGTH_LONG).show()
            } finally {
                progressBar.visibility = View.GONE
            }
        }
    }

    private fun openScoreEntryForAssignment(assignment: Assignment) {
        val fragment = ScoreEntryFragment.newInstance(
            assignment.classId,
            assignment.subjectId,
            assignment.className ?: "Class",
            assignment.subjectName ?: "Subject"
        )
        parentFragmentManager.beginTransaction()
            .replace(R.id.fragmentContainer, fragment)
            .addToBackStack(null)
            .commit()
    }
}
