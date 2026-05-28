package com.folushovictory.schools

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.ProgressBar
import android.widget.Spinner
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.folushovictory.schools.api.RetrofitClient
import com.folushovictory.schools.models.Score
import com.folushovictory.schools.models.ScoreListResponse
import kotlinx.coroutines.launch

class ScoreEntryEnhancedFragment : Fragment() {
    private lateinit var rvScores: RecyclerView
    private lateinit var spinnerSubject: Spinner
    private lateinit var btnSave: Button
    private lateinit var progressBar: ProgressBar

    private var classId: String? = null
    private var session: String? = null
    private var term: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        arguments?.let {
            classId = it.getString(ARG_CLASS_ID)
            session = it.getString(ARG_SESSION)
            term = it.getString(ARG_TERM)
        }
    }

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {
        return inflater.inflate(R.layout.fragment_score_entry_enhanced, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        rvScores = view.findViewById(R.id.rvScores)
        spinnerSubject = view.findViewById(R.id.spinnerSubject)
        btnSave = view.findViewById(R.id.btnSaveScores)
        progressBar = view.findViewById(R.id.progressBar)

        rvScores.layoutManager = LinearLayoutManager(requireContext())

        btnSave.setOnClickListener {
            saveScores()
        }

        loadScores()
    }

    private fun saveScores() {
        val cId = classId ?: run {
            Toast.makeText(requireContext(), "Invalid class", Toast.LENGTH_SHORT).show()
            return
        }

        val sessionVal = session ?: ""
        val termVal = term ?: ""
        val subjectId = spinnerSubject.selectedItem?.toString() ?: ""

        // Collect edited scores from RecyclerView children
        val scores = mutableListOf<com.folushovictory.schools.models.Score>()
        for (i in 0 until rvScores.childCount) {
            val child = rvScores.getChildAt(i)
            try {
                val tvId = child.findViewById<android.widget.TextView>(R.id.tvStudentId)
                val etCA1 = child.findViewById<android.widget.EditText>(R.id.etCA1)
                val etCA2 = child.findViewById<android.widget.EditText>(R.id.etCA2)
                val etExam = child.findViewById<android.widget.EditText>(R.id.etExam)

                val studentId = tvId?.text?.toString() ?: continue
                val ca1 = etCA1?.text?.toString()?.toDoubleOrNull()
                val ca2 = etCA2?.text?.toString()?.toDoubleOrNull()
                val exam = etExam?.text?.toString()?.toDoubleOrNull()

                scores.add(com.folushovictory.schools.models.Score(studentId = studentId, ca1 = ca1, ca2 = ca2, exam = exam))
            } catch (e: Exception) {
                // skip malformed row
            }
        }

        if (scores.isEmpty()) {
            Toast.makeText(requireContext(), "No scores to save", Toast.LENGTH_SHORT).show()
            return
        }

        val request = com.folushovictory.schools.models.ScoresRequest(
            session = sessionVal,
            term = termVal,
            classId = cId,
            subjectId = subjectId,
            scores = scores
        )

        progressBar.visibility = View.VISIBLE
        lifecycleScope.launch {
            try {
                val resp = RetrofitClient.api.saveScores(request)
                if (resp.isSuccessful) {
                    Toast.makeText(requireContext(), "Scores saved", Toast.LENGTH_SHORT).show()
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

    private fun loadScores() {
        val cId = classId ?: return
        val s = session ?: ""
        val t = term ?: ""
        progressBar.visibility = View.VISIBLE
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.api.getClassScores(cId, s, t, "")
                if (response.isSuccessful && response.body() != null) {
                    val scores = response.body()!!.scores
                    rvScores.adapter = ScoreAdapter(scores)
                } else {
                    Toast.makeText(requireContext(), "Unable to load scores", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Error: ${e.message}", Toast.LENGTH_LONG).show()
            } finally {
                progressBar.visibility = View.GONE
            }
        }
    }

    companion object {
        private const val ARG_CLASS_ID = "classId"
        private const val ARG_SESSION = "session"
        private const val ARG_TERM = "term"

        fun newInstance(classId: String, session: String, term: String): ScoreEntryEnhancedFragment {
            val f = ScoreEntryEnhancedFragment()
            val args = Bundle().apply {
                putString(ARG_CLASS_ID, classId)
                putString(ARG_SESSION, session)
                putString(ARG_TERM, term)
            }
            f.arguments = args
            return f
        }
    }
}
