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
import com.folushovictory.schools.models.PublishResultsRequest
import kotlinx.coroutines.launch

class AdminResultsFragment : Fragment() {
    private lateinit var classIdInput: EditText
    private lateinit var classNameInput: EditText
    private lateinit var sessionInput: EditText
    private lateinit var termInput: EditText
    private lateinit var btnPublish: Button
    private lateinit var subjectIdInput: EditText
    private lateinit var subjectNameInput: EditText
    private lateinit var btnEnterScores: Button
    private lateinit var btnViewBroadsheet: Button
    private lateinit var btnViewActivityLogs: Button
    private lateinit var btnManageRemarks: Button
    private lateinit var btnManageGradingScale: Button
    private lateinit var btnManageAssignments: Button

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_admin_results, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        classIdInput = view.findViewById(R.id.inputPublishClassId)
        classNameInput = view.findViewById(R.id.inputPublishClassName)
        sessionInput = view.findViewById(R.id.inputPublishSession)
        termInput = view.findViewById(R.id.inputPublishTerm)
        btnPublish = view.findViewById(R.id.btnPublishResults)
        subjectIdInput = view.findViewById(R.id.inputPublishSubjectId)
        subjectNameInput = view.findViewById(R.id.inputPublishSubjectName)
        btnEnterScores = view.findViewById(R.id.btnEnterScores)
        btnViewBroadsheet = view.findViewById(R.id.btnViewBroadsheet)
        btnViewActivityLogs = view.findViewById(R.id.btnViewActivityLogs)
        btnManageRemarks = view.findViewById(R.id.btnManageRemarks)
        btnManageGradingScale = view.findViewById(R.id.btnManageGradingScale)
        btnManageAssignments = view.findViewById(R.id.btnManageAssignments)

        btnPublish.setOnClickListener {
            publishResults()
        }

        btnEnterScores.setOnClickListener {
            openAdminScoreEntry()
        }

        btnViewBroadsheet.setOnClickListener {
            openBroadsheet()
        }

        btnViewActivityLogs.setOnClickListener {
            openActivityLogs()
        }

        btnManageRemarks.setOnClickListener {
            openAdminRemarks()
        }

        btnManageGradingScale.setOnClickListener {
            openGradingScale()
        }

        btnManageAssignments.setOnClickListener {
            openAdminAssignments()
        }
    }

    private fun openBroadsheet() {
        val classId = classIdInput.text.toString().trim()
        val session = sessionInput.text.toString().trim()
        val term = termInput.text.toString().trim()
        if (classId.isBlank() || session.isBlank() || term.isBlank()) {
            Toast.makeText(requireContext(), "Please provide class, session and term", Toast.LENGTH_SHORT).show()
            return
        }

        val fragment = BroadsheetFragment.newInstance(classId, session, term)
        parentFragmentManager.beginTransaction()
            .replace(R.id.fragmentContainer, fragment)
            .addToBackStack(null)
            .commit()
    }

    private fun openActivityLogs() {
        val fragment = ActivityLogsFragment()
        parentFragmentManager.beginTransaction()
            .replace(R.id.fragmentContainer, fragment)
            .addToBackStack(null)
            .commit()
    }

    private fun publishResults() {
        val classId = classIdInput.text.toString().trim()
        val session = sessionInput.text.toString().trim()
        val term = termInput.text.toString().trim()

        if (classId.isBlank() || session.isBlank() || term.isBlank()) {
            Toast.makeText(requireContext(), "Please provide class, session and term", Toast.LENGTH_SHORT).show()
            return
        }

        lifecycleScope.launch {
            try {
                val response = RetrofitClient.api.publishResults(
                    PublishResultsRequest(
                        classId = classId,
                        session = session,
                        term = term
                    )
                )

                if (response.isSuccessful) {
                    Toast.makeText(requireContext(), "Results published successfully", Toast.LENGTH_SHORT).show()
                } else {
                    Toast.makeText(requireContext(), "Failed to publish results", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun openAdminScoreEntry() {
        val classId = classIdInput.text.toString().trim()
        val className = classNameInput.text.toString().trim().ifEmpty { "Class" }
        val subjectId = subjectIdInput.text.toString().trim()
        val subjectName = subjectNameInput.text.toString().trim().ifEmpty { "Subject" }

        if (classId.isBlank()) {
            Toast.makeText(requireContext(), "Please provide Class ID to enter scores", Toast.LENGTH_SHORT).show()
            return
        }

        val fragment = AdminScoreEntryFragment.newInstance(classId, subjectId, className, subjectName)
        parentFragmentManager.beginTransaction()
            .replace(R.id.fragmentContainer, fragment)
            .addToBackStack(null)
            .commit()
    }

    private fun openAdminRemarks() {
        val fragment = AdminRemarksFragment()
        parentFragmentManager.beginTransaction()
            .replace(R.id.fragmentContainer, fragment)
            .addToBackStack(null)
            .commit()
    }

    private fun openGradingScale() {
        val fragment = AdminGradingScaleFragment()
        parentFragmentManager.beginTransaction()
            .replace(R.id.fragmentContainer, fragment)
            .addToBackStack(null)
            .commit()
    }

    private fun openAdminAssignments() {
        val fragment = AdminAssignmentsFragment()
        parentFragmentManager.beginTransaction()
            .replace(R.id.fragmentContainer, fragment)
            .addToBackStack(null)
            .commit()
    }
}
