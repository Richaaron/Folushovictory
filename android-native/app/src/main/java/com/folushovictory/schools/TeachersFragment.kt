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
import com.folushovictory.schools.models.Teacher
import com.folushovictory.schools.models.TeacherCreateRequest
import com.folushovictory.schools.models.TeacherUpdateRequest
import com.google.android.material.floatingactionbutton.FloatingActionButton
import kotlinx.coroutines.launch

class TeachersFragment : Fragment() {
    private lateinit var recyclerView: RecyclerView
    private lateinit var fabAdd: FloatingActionButton
    private lateinit var etSearchTeachers: EditText
    private lateinit var btnRefreshTeachers: Button
    private lateinit var tvTeacherCount: TextView
    private var allTeachers: List<Teacher> = emptyList()
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_teachers_management, container, false)
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        recyclerView = view.findViewById(R.id.recyclerView)
        etSearchTeachers = view.findViewById(R.id.etSearchTeachers)
        btnRefreshTeachers = view.findViewById(R.id.btnRefreshTeachers)
        tvTeacherCount = view.findViewById(R.id.tvTeacherCount)
        recyclerView.layoutManager = LinearLayoutManager(requireContext())
        
        fabAdd = view.findViewById(R.id.fabAdd)
        fabAdd.setOnClickListener {
            showTeacherDialog()
        }

        btnRefreshTeachers.setOnClickListener {
            loadTeachers()
        }

        etSearchTeachers.addTextChangedListener {
            filterTeachers(it?.toString().orEmpty())
        }
        
        loadTeachers()
    }
    
    private fun loadTeachers() {
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.api.getTeachers()
                if (response.isSuccessful && response.body() != null) {
                    allTeachers = response.body()!!.teachers
                    updateTeacherList(allTeachers)
                } else {
                    Toast.makeText(requireContext(), "Failed to load teachers", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun updateTeacherList(teachers: List<Teacher>) {
        tvTeacherCount.text = "${teachers.size} teachers"
        recyclerView.adapter = TeacherAdapter(teachers) { teacher ->
            showTeacherDialog(teacher)
        }
    }

    private fun filterTeachers(query: String) {
        val filtered = allTeachers.filter { teacher ->
            val search = query.trim().lowercase()
            teacher.displayName.lowercase().contains(search) ||
            teacher.username.lowercase().contains(search) ||
            (teacher.formClassId?.lowercase()?.contains(search) ?: false)
        }
        updateTeacherList(filtered)
    }

    private fun showTeacherDialog(teacher: Teacher? = null) {
        val title = if (teacher == null) "Add Teacher" else "Edit Teacher"

        val displayNameInput = EditText(requireContext()).apply {
            hint = "Display name"
            inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_FLAG_CAP_WORDS
            setText(teacher?.displayName ?: "")
        }

        val emailInput = EditText(requireContext()).apply {
            hint = "Email (optional)"
            inputType = InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS
            setText(teacher?.email ?: "")
        }

        val formClassInput = EditText(requireContext()).apply {
            hint = "Form class ID (optional)"
            inputType = InputType.TYPE_CLASS_TEXT
            setText(teacher?.formClassId ?: "")
        }

        val container = LinearLayout(requireContext()).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(32, 24, 32, 0)
            addView(displayNameInput)
            addView(emailInput)
            addView(formClassInput)
        }

        AlertDialog.Builder(requireContext())
            .setTitle(title)
            .setView(container)
            .setPositiveButton("Save") { _, _ ->
                val displayName = displayNameInput.text.toString().trim()
                val email = emailInput.text.toString().trim().takeIf { it.isNotEmpty() }
                if (displayName.isBlank()) {
                    Toast.makeText(requireContext(), "Display name is required", Toast.LENGTH_SHORT).show()
                    return@setPositiveButton
                }

                val formClassId = formClassInput.text.toString().trim().takeIf { it.isNotEmpty() }

                lifecycleScope.launch {
                    try {
                        if (teacher == null) {
                            val request = TeacherCreateRequest(displayName = displayName, email = email, formClassId = formClassId)
                            val createResponse = RetrofitClient.api.createTeacher(request)
                            if (createResponse.isSuccessful) {
                                Toast.makeText(requireContext(), "Teacher created", Toast.LENGTH_SHORT).show()
                                loadTeachers()
                            } else {
                                Toast.makeText(requireContext(), "Failed to create teacher", Toast.LENGTH_SHORT).show()
                            }
                        } else {
                            val request = TeacherUpdateRequest(displayName = displayName, email = email, formClassId = formClassId)
                            val updateResponse = RetrofitClient.api.updateTeacher(teacher.username, request)
                            if (updateResponse.isSuccessful) {
                                Toast.makeText(requireContext(), "Teacher updated", Toast.LENGTH_SHORT).show()
                                loadTeachers()
                            } else {
                                Toast.makeText(requireContext(), "Failed to update teacher", Toast.LENGTH_SHORT).show()
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
