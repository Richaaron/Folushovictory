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
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.folushovictory.schools.api.RetrofitClient
import com.folushovictory.schools.models.SchoolSettings
import com.folushovictory.schools.models.Score
import com.folushovictory.schools.models.ScoresRequest
import com.folushovictory.schools.models.Student
import kotlinx.coroutines.launch

class AdminScoreEntryFragment : Fragment() {
    companion object {
        private const val ARG_CLASS_ID = "ARG_CLASS_ID"
        private const val ARG_SUBJECT_ID = "ARG_SUBJECT_ID"
        private const val ARG_CLASS_NAME = "ARG_CLASS_NAME"
        private const val ARG_SUBJECT_NAME = "ARG_SUBJECT_NAME"

        fun newInstance(classId: String, subjectId: String, className: String, subjectName: String): AdminScoreEntryFragment {
            val fragment = AdminScoreEntryFragment()
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
    private val scoreRows = mutableListOf<ScoreEntryFragment.StudentScoreRow>()
    private lateinit var adapter: ScoreEntryAdapter
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

        tvScoreHeader.text = "Admin Score Entry"
        tvScoreSubheader.text = "$className • $subjectName"

        rvScoreRoster.layoutManager = LinearLayoutManager(requireContext())
        adapter = ScoreEntryAdapter(scoreRows)
        rvScoreRoster.adapter = adapter

        btnSaveScores.setOnClickListener { saveScores() }

        loadScoreRoster()
    }

    private fun loadScoreRoster() {
        progressBar.visibility = View.VISIBLE
        lifecycleScope.launch {
            try {
                val scoresResp = if (TextUtils.isEmpty(subjectId)) {
                    // If no subject specified, fall back to class students
                    RetrofitClient.api.getClassStudents(classId)
                } else {
                    // Use admin class scores endpoint to prefill if available
                    RetrofitClient.api.getAdminClassScores(classId, currentSession, currentTerm, subjectId)
                }

                val schoolResponse = RetrofitClient.api.getSchoolSettings()

                if (schoolResponse.isSuccessful && schoolResponse.body() != null) {
                    val settings = schoolResponse.body()!!
                    currentSession = settings.currentSession ?: currentSession
                    currentTerm = settings.currentTerm ?: currentTerm
                }

                if (scoresResp.isSuccessful && scoresResp.body() != null) {
                    val students = when {
                        scoresResp.body() is com.folushovictory.schools.models.ScoreListResponse -> {
                            // If API returned scores, extract students from scores (we'll use studentId only)
                            val list = (scoresResp.body() as com.folushovictory.schools.models.ScoreListResponse).scores
                            list.map { s -> Student(studentId = s.studentId, firstName = "", lastName = "") }
                        }
                        else -> {
                            scoresResp.body()!!::class.java.getDeclaredFields().let {
                                emptyList()
                            }
                        }
                    }

                    // If we couldn't parse students, fetch by class
                    val finalStudents = if (students.isEmpty()) {
                        val resp = RetrofitClient.api.getClassStudents(classId)
                        if (resp.isSuccessful && resp.body() != null) resp.body()!!.students else emptyList()
                    } else students

                    scoreRows.clear()
                    scoreRows.addAll(finalStudents.map { student ->
                        ScoreEntryFragment.StudentScoreRow(student)
                    })
                    adapter.notifyDataSetChanged()
                } else {
                    // fallback to class students
                    val resp = RetrofitClient.api.getClassStudents(classId)
                    if (resp.isSuccessful && resp.body() != null) {
                        val students = resp.body()!!.students
                        scoreRows.clear()
                        scoreRows.addAll(students.map { student -> ScoreEntryFragment.StudentScoreRow(student) })
                        adapter.notifyDataSetChanged()
                    } else {
                        Toast.makeText(requireContext(), "Unable to load students for class", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Error: ${e.message}", Toast.LENGTH_LONG).show()
            } finally {
                progressBar.visibility = View.GONE
            }
        }
    }

    private fun saveScores() {
        if (TextUtils.isEmpty(classId)) {
            Toast.makeText(requireContext(), "Invalid class data", Toast.LENGTH_SHORT).show()
            return
        }

        val scores = scoreRows.map { row ->
            Score(studentId = row.student.studentId, ca1 = row.ca1, ca2 = row.ca2, exam = row.exam)
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
                val response = RetrofitClient.api.saveAdminScores(request)
                if (response.isSuccessful) {
                    Toast.makeText(requireContext(), "Scores saved", Toast.LENGTH_SHORT).show()
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
}
