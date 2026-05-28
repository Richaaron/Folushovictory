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
import com.folushovictory.schools.models.PrincipalRemarkRequest
import com.folushovictory.schools.models.TeacherRemarkRequest
import kotlinx.coroutines.launch

class AdminRemarksFragment : Fragment() {
    private lateinit var inputStudentId: EditText
    private lateinit var inputSession: EditText
    private lateinit var inputTerm: EditText
    private lateinit var inputTeacherRemark: EditText
    private lateinit var btnSetTeacher: Button
    private lateinit var inputPrincipalRemark: EditText
    private lateinit var btnSetPrincipal: Button

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {
        return inflater.inflate(R.layout.fragment_admin_remarks, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        inputStudentId = view.findViewById(R.id.inputRemarkStudentId)
        inputSession = view.findViewById(R.id.inputRemarkSession)
        inputTerm = view.findViewById(R.id.inputRemarkTerm)
        inputTeacherRemark = view.findViewById(R.id.inputTeacherRemark)
        btnSetTeacher = view.findViewById(R.id.btnSetTeacherRemark)
        inputPrincipalRemark = view.findViewById(R.id.inputPrincipalRemark)
        btnSetPrincipal = view.findViewById(R.id.btnSetPrincipalRemark)

        btnSetTeacher.setOnClickListener { setTeacherRemark() }
        btnSetPrincipal.setOnClickListener { setPrincipalRemark() }
    }

    private fun setTeacherRemark() {
        val sid = inputStudentId.text.toString().trim()
        val session = inputSession.text.toString().trim()
        val term = inputTerm.text.toString().trim()
        val remark = inputTeacherRemark.text.toString().trim()
        if (sid.isBlank() || session.isBlank() || term.isBlank()) {
            Toast.makeText(requireContext(), "Provide student, session and term", Toast.LENGTH_SHORT).show()
            return
        }
        lifecycleScope.launch {
            try {
                val resp = RetrofitClient.api.setTeacherRemark(TeacherRemarkRequest(session = session, term = term, studentId = sid, teacherRemark = remark))
                if (resp.isSuccessful) Toast.makeText(requireContext(), "Teacher remark set", Toast.LENGTH_SHORT).show()
                else Toast.makeText(requireContext(), "Failed to set teacher remark", Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Error: ${e.message}", Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun setPrincipalRemark() {
        val sid = inputStudentId.text.toString().trim()
        val session = inputSession.text.toString().trim()
        val term = inputTerm.text.toString().trim()
        val remark = inputPrincipalRemark.text.toString().trim()
        if (sid.isBlank() || session.isBlank() || term.isBlank()) {
            Toast.makeText(requireContext(), "Provide student, session and term", Toast.LENGTH_SHORT).show()
            return
        }
        lifecycleScope.launch {
            try {
                val resp = RetrofitClient.api.setPrincipalRemark(PrincipalRemarkRequest(session = session, term = term, studentId = sid, principalRemark = remark))
                if (resp.isSuccessful) Toast.makeText(requireContext(), "Principal remark set", Toast.LENGTH_SHORT).show()
                else Toast.makeText(requireContext(), "Failed to set principal remark", Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Error: ${e.message}", Toast.LENGTH_LONG).show()
            }
        }
    }
}
