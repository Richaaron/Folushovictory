package com.folushovictory.schools

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.folushovictory.schools.api.RetrofitClient
import com.folushovictory.schools.models.AdminAssignmentRequest
import kotlinx.coroutines.launch

class AdminAssignmentsFragment : Fragment() {
    private lateinit var inputTeacher: EditText
    private lateinit var inputSubjects: EditText
    private lateinit var inputClasses: EditText
    private lateinit var btnSaveAssignments: Button

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {
        return inflater.inflate(R.layout.fragment_admin_assignments, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        inputTeacher = view.findViewById(R.id.inputAssignmentTeacher)
        inputSubjects = view.findViewById(R.id.inputAssignmentSubjects)
        inputClasses = view.findViewById(R.id.inputAssignmentClasses)
        btnSaveAssignments = view.findViewById(R.id.btnSaveAssignments)

        btnSaveAssignments.setOnClickListener { saveAssignments() }
    }

    private fun saveAssignments() {
        val teacherUsername = inputTeacher.text.toString().trim().lowercase()
        val subjectIds = inputSubjects.text.toString().split(",").map { it.trim() }.filter { it.isNotEmpty() }
        val classIds = inputClasses.text.toString().split(",").map { it.trim() }.filter { it.isNotEmpty() }

        if (teacherUsername.isBlank() || subjectIds.isEmpty()) {
            Toast.makeText(requireContext(), "Enter teacher username and at least one subject ID", Toast.LENGTH_SHORT).show()
            return
        }

        val request = AdminAssignmentRequest(
            teacherUsername = teacherUsername,
            subjectIds = subjectIds,
            classIds = if (classIds.isEmpty()) null else classIds
        )

        lifecycleScope.launch {
            try {
                val response = RetrofitClient.api.createAdminAssignments(request)
                if (response.isSuccessful) {
                    val body = response.body()
                    val message = body?.message ?: "Assigned ${body?.count ?: 0} subject(s)"
                    Toast.makeText(requireContext(), message, Toast.LENGTH_LONG).show()
                } else {
                    Toast.makeText(requireContext(), "Failed to assign subjects", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Error: ${e.message}", Toast.LENGTH_LONG).show()
            }
        }
    }
}
