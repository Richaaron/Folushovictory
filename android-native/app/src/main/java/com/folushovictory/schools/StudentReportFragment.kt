package com.folushovictory.schools

import android.os.Bundle
import android.view.View
import android.widget.ProgressBar
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.folushovictory.schools.api.RetrofitClient
import com.folushovictory.schools.models.StudentReportResponse
import kotlinx.coroutines.launch

class StudentReportFragment : Fragment(R.layout.fragment_student_report) {
    private lateinit var progressBar: ProgressBar
    private lateinit var contentGroup: View
    private lateinit var textStudentName: TextView
    private lateinit var textStudentClass: TextView
    private lateinit var textReportSession: TextView
    private lateinit var textAverage: TextView
    private lateinit var textPosition: TextView
    private lateinit var textStatus: TextView
    private lateinit var subjectsRecyclerView: RecyclerView
    private lateinit var textErrorMessage: TextView

    private var studentId: String? = null
    private var session: String? = null
    private var term: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        arguments?.let {
            studentId = it.getString(ARG_STUDENT_ID)
            session = it.getString(ARG_SESSION)
            term = it.getString(ARG_TERM)
        }
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        progressBar = view.findViewById(R.id.reportProgress)
        contentGroup = view.findViewById(R.id.reportContent)
        textStudentName = view.findViewById(R.id.reportStudentName)
        textStudentClass = view.findViewById(R.id.reportStudentClass)
        textReportSession = view.findViewById(R.id.reportSessionTerm)
        textAverage = view.findViewById(R.id.reportAverage)
        textPosition = view.findViewById(R.id.reportPosition)
        textStatus = view.findViewById(R.id.reportStatus)
        subjectsRecyclerView = view.findViewById(R.id.subjectsRecyclerView)
        textErrorMessage = view.findViewById(R.id.reportError)

        subjectsRecyclerView.layoutManager = LinearLayoutManager(requireContext())

        loadReport()
    }

    private fun loadReport() {
        lifecycleScope.launch {
            showLoading(true)
            textErrorMessage.visibility = View.GONE
            try {
                val finalSession = session ?: getCurrentSession()
                val finalTerm = term ?: getCurrentTerm()
                if (studentId.isNullOrBlank() || finalSession.isBlank() || finalTerm.isBlank()) {
                    showError("Missing report information")
                    return@launch
                }

                val response = RetrofitClient.api.getStudentReport(studentId!!, finalSession, finalTerm)
                if (response.isSuccessful) {
                    response.body()?.let(this@StudentReportFragment::displayReport) ?: showError("Report not available")
                } else {
                    showError("Failed to load report: ${response.code()}")
                }
            } catch (error: Exception) {
                showError(error.message ?: "Failed to load report")
            } finally {
                showLoading(false)
            }
        }
    }

    private suspend fun getCurrentSession(): String {
        val response = RetrofitClient.api.getSchoolSettings()
        return if (response.isSuccessful) {
            response.body()?.currentSession.orEmpty()
        } else {
            ""
        }
    }

    private suspend fun getCurrentTerm(): String {
        val response = RetrofitClient.api.getSchoolSettings()
        return if (response.isSuccessful) {
            response.body()?.currentTerm.orEmpty()
        } else {
            ""
        }
    }

    private fun displayReport(report: StudentReportResponse) {
        textStudentName.text = "${report.student.firstName} ${report.student.lastName}"
        val classInfo = report.studentClass
        val className = if (classInfo != null) classInfo.name.orEmpty() else report.student.classId.orEmpty()
        textStudentClass.text = className
        textReportSession.text = "${report.session.orEmpty()} ${report.term.orEmpty()}"
        textAverage.text = report.result?.average?.let { String.format("%.1f%%", it) } ?: "N/A"
        textPosition.text = report.result?.position?.toString() ?: "N/A"
        textStatus.text = if (report.released == true) "Released" else "Not Released"

        val subjects = report.result?.perSubject.orEmpty()
        subjectsRecyclerView.adapter = SubjectReportAdapter(subjects)
        textErrorMessage.visibility = View.GONE
        contentGroup.visibility = View.VISIBLE
    }

    private fun showLoading(isLoading: Boolean) {
        progressBar.visibility = if (isLoading) View.VISIBLE else View.GONE
        contentGroup.visibility = if (isLoading) View.GONE else View.VISIBLE
    }

    private fun showError(message: String) {
        textErrorMessage.text = message
        textErrorMessage.visibility = View.VISIBLE
        contentGroup.visibility = View.GONE
    }

    companion object {
        private const val ARG_STUDENT_ID = "studentId"
        private const val ARG_SESSION = "session"
        private const val ARG_TERM = "term"

        fun newInstance(studentId: String, session: String?, term: String?): StudentReportFragment {
            val fragment = StudentReportFragment()
            val args = Bundle().apply {
                putString(ARG_STUDENT_ID, studentId)
                putString(ARG_SESSION, session)
                putString(ARG_TERM, term)
            }
            fragment.arguments = args
            return fragment
        }
    }
}
