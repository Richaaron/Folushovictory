package com.folushovictory.schools

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.ProgressBar
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.folushovictory.schools.api.RetrofitClient
import kotlinx.coroutines.launch

class ReportGeneratorFragment : Fragment() {
    private lateinit var etClassId: EditText
    private lateinit var etSession: EditText
    private lateinit var etTerm: EditText
    private lateinit var btnGenerate: Button
    private lateinit var progressBar: ProgressBar

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {
        return inflater.inflate(R.layout.fragment_report_generator, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        etClassId = view.findViewById(R.id.etClassId)
        etSession = view.findViewById(R.id.etSession)
        etTerm = view.findViewById(R.id.etTerm)
        btnGenerate = view.findViewById(R.id.btnGenerate)
        progressBar = view.findViewById(R.id.progressBar)

        btnGenerate.setOnClickListener {
            val classId = etClassId.text.toString().trim()
            val session = etSession.text.toString().trim()
            val term = etTerm.text.toString().trim()
            if (classId.isEmpty() || session.isEmpty() || term.isEmpty()) {
                Toast.makeText(requireContext(), "Class, session and term are required", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            generateReports(classId, session, term)
        }
    }

    private fun generateReports(classId: String, session: String, term: String) {
        progressBar.visibility = View.VISIBLE
        lifecycleScope.launch {
            try {
                val body = com.google.gson.JsonObject().apply {
                    addProperty("session", session)
                    addProperty("term", term)
                }
                val resp = RetrofitClient.api.generateBulkReports(classId, body)
                if (resp.isSuccessful) {
                    Toast.makeText(requireContext(), "Reports generated: server responded", Toast.LENGTH_LONG).show()
                } else {
                    Toast.makeText(requireContext(), "Failed to generate reports: ${resp.code()}", Toast.LENGTH_LONG).show()
                }
            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Error: ${e.message}", Toast.LENGTH_LONG).show()
            } finally {
                progressBar.visibility = View.GONE
            }
        }
    }
}
