package com.folushovictory.schools

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.folushovictory.schools.api.RetrofitClient
import com.folushovictory.schools.models.Class
import com.folushovictory.schools.models.Student
import kotlinx.coroutines.launch

class FormClassManagementFragment : Fragment() {
    private lateinit var tvSelectedClass: TextView
    private lateinit var rvFormClasses: RecyclerView
    private lateinit var rvClassStudents: RecyclerView
    private lateinit var btnLoadStudents: Button
    private lateinit var btnBulkAssign: Button
    private lateinit var progressBar: ProgressBar

    private var selectedClass: Class? = null
    private var currentStudents: List<Student> = emptyList()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_form_class_management, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        tvSelectedClass = view.findViewById(R.id.tvSelectedClass)
        rvFormClasses = view.findViewById(R.id.rvFormClasses)
        rvClassStudents = view.findViewById(R.id.rvClassStudents)
        btnLoadStudents = view.findViewById(R.id.btnLoadStudents)
        btnBulkAssign = view.findViewById(R.id.btnBulkAssign)
        progressBar = view.findViewById(R.id.progressBar)

        rvFormClasses.layoutManager = LinearLayoutManager(requireContext())
        rvClassStudents.layoutManager = LinearLayoutManager(requireContext())

        btnLoadStudents.setOnClickListener {
            selectedClass?.let { loadClassStudents(it.id) }
                ?: Toast.makeText(requireContext(), "Select a class first", Toast.LENGTH_SHORT).show()
        }

        btnBulkAssign.setOnClickListener {
            selectedClass?.let { showBulkAssignNotice(it.name) }
                ?: Toast.makeText(requireContext(), "Select a class to manage", Toast.LENGTH_SHORT).show()
        }

        loadClasses()
    }

    private fun loadClasses() {
        progressBar.visibility = View.VISIBLE
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.api.getClasses()
                if (response.isSuccessful && response.body() != null) {
                    val classes = response.body()!!.classes
                    rvFormClasses.adapter = ClassAdapter(classes) { selected ->
                        selectedClass = selected
                        tvSelectedClass.text = "Selected class: ${selected.name} (${selected.level})"
                        currentStudents = emptyList()
                        rvClassStudents.adapter = StudentAdapter(emptyList()) {}
                    }
                } else {
                    Toast.makeText(requireContext(), "Unable to load classes", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Error loading classes: ${e.message}", Toast.LENGTH_LONG).show()
            } finally {
                progressBar.visibility = View.GONE
            }
        }
    }

    private fun loadClassStudents(classId: String) {
        progressBar.visibility = View.VISIBLE
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.api.getClassStudents(classId)
                if (response.isSuccessful && response.body() != null) {
                    currentStudents = response.body()!!.students
                    rvClassStudents.adapter = StudentAdapter(currentStudents) { student ->
                        Toast.makeText(
                            requireContext(),
                            "${student.firstName} ${student.lastName} — ${student.classId}",
                            Toast.LENGTH_SHORT
                        ).show()
                    }
                } else {
                    Toast.makeText(requireContext(), "Unable to load class students", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Error loading students: ${e.message}", Toast.LENGTH_LONG).show()
            } finally {
                progressBar.visibility = View.GONE
            }
        }
    }

    private fun showBulkAssignNotice(className: String) {
        Toast.makeText(
            requireContext(),
            "Bulk student operations for $className are ready for backend integration.",
            Toast.LENGTH_LONG
        ).show()
    }
}
