package com.folushovictory.schools

import android.os.Bundle
import android.text.InputType
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.core.widget.addTextChangedListener
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.folushovictory.schools.api.RetrofitClient
import com.folushovictory.schools.models.Student
import com.folushovictory.schools.models.StudentCreateRequest
import com.folushovictory.schools.models.StudentUpdateRequest
import com.google.android.material.floatingactionbutton.FloatingActionButton
import kotlinx.coroutines.launch

class StudentsFragment : Fragment() {
    private lateinit var recyclerView: RecyclerView
    private lateinit var fabAdd: FloatingActionButton
    private lateinit var etSearchStudents: EditText
    private lateinit var btnFindDuplicates: Button
    private lateinit var tvStudentCount: TextView
    private var allStudents: List<Student> = emptyList()
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_students_management, container, false)
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        recyclerView = view.findViewById(R.id.recyclerView)
        etSearchStudents = view.findViewById(R.id.etSearchStudents)
        btnFindDuplicates = view.findViewById(R.id.btnFindDuplicates)
        tvStudentCount = view.findViewById(R.id.tvStudentCount)
        recyclerView.layoutManager = LinearLayoutManager(requireContext())
        
        fabAdd = view.findViewById(R.id.fabAdd)
        fabAdd.setOnClickListener {
            showStudentDialog()
        }

        btnFindDuplicates.setOnClickListener {
            findDuplicateStudents()
        }

        etSearchStudents.addTextChangedListener {
            filterStudents(it?.toString().orEmpty())
        }
        
        loadStudents()
    }
    
    private fun loadStudents() {
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.api.getStudents()
                if (response.isSuccessful && response.body() != null) {
                    allStudents = response.body()!!.students
                    updateStudentList(allStudents)
                } else {
                    Toast.makeText(requireContext(), "Failed to load students", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun updateStudentList(students: List<Student>) {
        tvStudentCount.text = "${students.size} students"
        recyclerView.adapter = StudentAdapter(students) { student ->
            showStudentDialog(student)
        }
    }

    private fun filterStudents(query: String) {
        val filtered = allStudents.filter { student ->
            val search = query.trim().lowercase()
            student.firstName.lowercase().contains(search) ||
            student.lastName.lowercase().contains(search) ||
            (student.classId?.lowercase()?.contains(search) ?: false) ||
            (student.parentName?.lowercase()?.contains(search) ?: false)
        }
        updateStudentList(filtered)
    }

    private fun findDuplicateStudents() {
        val duplicates = allStudents.groupBy { "${it.firstName.lowercase()}_${it.lastName.lowercase()}_${it.classId.orEmpty().lowercase()}" }
            .filter { it.value.size > 1 }
            .flatMap { it.value }

        if (duplicates.isEmpty()) {
            Toast.makeText(requireContext(), "No duplicates found", Toast.LENGTH_SHORT).show()
            return
        }

        val listMessage = duplicates.joinToString(separator = "\n") { student ->
            "${student.firstName} ${student.lastName} (${student.classId.orEmpty()})"
        }

        AlertDialog.Builder(requireContext())
            .setTitle("Duplicate students found")
            .setMessage(listMessage)
            .setPositiveButton("OK", null)
            .show()
    }

    private fun showStudentDialog(student: Student? = null) {
        val title = if (student == null) "Add Student" else "Edit Student"

        val firstNameInput = EditText(requireContext()).apply {
            hint = "First name"
            inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_FLAG_CAP_WORDS
            setText(student?.firstName ?: "")
        }
        val lastNameInput = EditText(requireContext()).apply {
            hint = "Last name"
            inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_FLAG_CAP_WORDS
            setText(student?.lastName ?: "")
        }
        val classIdInput = EditText(requireContext()).apply {
            hint = "Class ID"
            inputType = InputType.TYPE_CLASS_TEXT
            setText(student?.classId ?: "")
        }
        val parentNameInput = EditText(requireContext()).apply {
            hint = "Parent name"
            inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_FLAG_CAP_WORDS
            setText(student?.parentName ?: "")
        }
        val parentEmailInput = EditText(requireContext()).apply {
            hint = "Parent email (optional)"
            inputType = InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS
            setText(student?.parentEmail ?: "")
        }

        val container = LinearLayout(requireContext()).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(32, 24, 32, 0)
            addView(firstNameInput)
            addView(lastNameInput)
            addView(classIdInput)
            addView(parentNameInput)
            addView(parentEmailInput)
        }

        AlertDialog.Builder(requireContext())
            .setTitle(title)
            .setView(container)
            .setPositiveButton("Save") { _, _ ->
                val firstName = firstNameInput.text.toString().trim()
                val lastName = lastNameInput.text.toString().trim()
                val classId = classIdInput.text.toString().trim()
                val parentName = parentNameInput.text.toString().trim()
                val parentEmail = parentEmailInput.text.toString().trim().takeIf { it.isNotEmpty() }

                if (firstName.isBlank() || lastName.isBlank() || classId.isBlank() || parentName.isBlank()) {
                    Toast.makeText(requireContext(), "First name, last name, class ID and parent name are required", Toast.LENGTH_SHORT).show()
                    return@setPositiveButton
                }

                lifecycleScope.launch {
                    try {
                        if (student == null) {
                            val request = StudentCreateRequest(
                                firstName = firstName,
                                lastName = lastName,
                                classId = classId,
                                parentName = parentName,
                                parentEmail = parentEmail
                            )
                            val createResponse = RetrofitClient.api.createStudent(request)
                            if (createResponse.isSuccessful) {
                                Toast.makeText(requireContext(), "Student created", Toast.LENGTH_SHORT).show()
                                loadStudents()
                            } else {
                                Toast.makeText(requireContext(), "Failed to create student", Toast.LENGTH_SHORT).show()
                            }
                        } else {
                            val request = StudentUpdateRequest(
                                firstName = firstName,
                                lastName = lastName,
                                classId = classId,
                                parentName = parentName,
                                parentEmail = parentEmail
                            )
                            val updateResponse = RetrofitClient.api.updateStudent(student.studentId, request)
                            if (updateResponse.isSuccessful) {
                                Toast.makeText(requireContext(), "Student updated", Toast.LENGTH_SHORT).show()
                                loadStudents()
                            } else {
                                Toast.makeText(requireContext(), "Failed to update student", Toast.LENGTH_SHORT).show()
                            }
                        }
                    } catch (e: Exception) {
                        Toast.makeText(requireContext(), "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                    }
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
}
