package com.folushovictory.schools

import android.os.Bundle
import android.text.TextUtils
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.recyclerview.widget.RecyclerView
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.folushovictory.schools.api.RetrofitClient
import com.folushovictory.schools.models.SchoolSettings
import com.folushovictory.schools.models.Score
import com.folushovictory.schools.models.ScoresRequest
import com.folushovictory.schools.models.Student
import kotlinx.coroutines.launch

class ScoreEntryFragment : Fragment() {
    companion object {
        private const val ARG_CLASS_ID = "ARG_CLASS_ID"
        private const val ARG_SUBJECT_ID = "ARG_SUBJECT_ID"
        private const val ARG_CLASS_NAME = "ARG_CLASS_NAME"
        private const val ARG_SUBJECT_NAME = "ARG_SUBJECT_NAME"

        fun newInstance(classId: String, subjectId: String, className: String, subjectName: String): ScoreEntryFragment {
            val fragment = ScoreEntryFragment()
            val bundle = Bundle().apply {
                putString(ARG_CLASS_ID, classId)
                putString(ARG_SUBJECT_ID, subjectId)
                putString(ARG_CLASS_NAME, className)
                putString(ARG_SUBJECT_NAME, subjectName)
            }
            fragment.arguments = bundle
            return fragment
        }
    }

    private lateinit var classId: String
    private lateinit var subjectId: String
    private lateinit var className: String
    private lateinit var subjectName: String

    private lateinit var tvScoreHeader: TextView
    private lateinit var tvScoreSubheader: TextView
    private lateinit var rvScoreRoster: RecyclerView
    private lateinit var btnSaveScores: Button
    private lateinit var progressBar: ProgressBar
    private lateinit var adapter: ScoreEntryAdapter
    private val scoreRows = mutableListOf<StudentScoreRow>()
    private var currentSession: String = "Current Session"
    private var currentTerm: String = "Current Term"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        arguments?.let { bundle ->
            classId = bundle.getString(ARG_CLASS_ID, "")
            subjectId = bundle.getString(ARG_SUBJECT_ID, "")
            className = bundle.getString(ARG_CLASS_NAME, "Class")
            subjectName = bundle.getString(ARG_SUBJECT_NAME, "Subject")
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_score_entry, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        tvScoreHeader = view.findViewById(R.id.tvScoreHeader)
        tvScoreSubheader = view.findViewById(R.id.tvScoreSubheader)
        rvScoreRoster = view.findViewById(R.id.rvScoreRoster)
        btnSaveScores = view.findViewById(R.id.btnSaveScores)
        progressBar = view.findViewById(R.id.progressBar)

        tvScoreHeader.text = "Score Entry"
        tvScoreSubheader.text = "$className • $subjectName"

        rvScoreRoster.layoutManager = LinearLayoutManager(requireContext())
        adapter = ScoreEntryAdapter(scoreRows)
        rvScoreRoster.adapter = adapter

        btnSaveScores.setOnClickListener {
            saveScores()
        }

        loadScoreRoster()
    }

    private fun loadScoreRoster() {
        progressBar.visibility = View.VISIBLE
        lifecycleScope.launch {
            try {
                val studentsResponse = RetrofitClient.api.getClassStudents(classId)
                val schoolResponse = RetrofitClient.api.getSchoolSettings()

                if (schoolResponse.isSuccessful && schoolResponse.body() != null) {
                    updateTermInfo(schoolResponse.body()!!)
                }

                if (studentsResponse.isSuccessful && studentsResponse.body() != null) {
                    val students = studentsResponse.body()!!.students
                    scoreRows.clear()
                    scoreRows.addAll(students.map { student ->
                        StudentScoreRow(student)
                    })
                    adapter.notifyDataSetChanged()
                    if (students.isEmpty()) {
                        tvScoreSubheader.text = "No students found for $className"
                    }
                } else {
                    Toast.makeText(requireContext(), "Unable to load students", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Error: ${e.message}", Toast.LENGTH_LONG).show()
            } finally {
                progressBar.visibility = View.GONE
            }
        }
    }

    private fun updateTermInfo(settings: SchoolSettings) {
        currentSession = settings.currentSession ?: currentSession
        currentTerm = settings.currentTerm ?: currentTerm
        tvScoreSubheader.text = "$className • $subjectName"
    }

    private fun saveScores() {
        if (TextUtils.isEmpty(subjectId) || TextUtils.isEmpty(classId)) {
            Toast.makeText(requireContext(), "Invalid assignment data", Toast.LENGTH_SHORT).show()
            return
        }

        val scores = scoreRows.map { row ->
            Score(
                studentId = row.student.studentId,
                ca1 = row.ca1,
                ca2 = row.ca2,
                exam = row.exam
            )
        }

        val request = ScoresRequest(
            session = currentSession,
            term = currentTerm,
            classId = classId,
            subjectId = subjectId,
            scores = scores
        )

        progressBar.visibility = View.VISIBLE
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.api.saveScores(request)
                if (response.isSuccessful) {
                    Toast.makeText(requireContext(), "Scores saved successfully", Toast.LENGTH_SHORT).show()
                    parentFragmentManager.popBackStack()
                } else {
                    Toast.makeText(requireContext(), "Failed to save scores", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Error: ${e.message}", Toast.LENGTH_LONG).show()
            } finally {
                progressBar.visibility = View.GONE
            }
        }
    }

    data class StudentScoreRow(
        val student: Student,
        var ca1: Double? = null,
        var ca2: Double? = null,
        var exam: Double? = null
    )
}
