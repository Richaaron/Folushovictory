package com.folushovictory.schools

import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.ProgressBar
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.folushovictory.schools.api.RetrofitClient
import com.folushovictory.schools.models.Student
import kotlinx.coroutines.launch

class ParentReportsFragment : Fragment(R.layout.fragment_parent_reports) {
    private lateinit var progressBar: ProgressBar
    private lateinit var contentGroup: View
    private lateinit var textStudentName: TextView
    private lateinit var textStudentClass: TextView
    private lateinit var buttonViewLatestReport: Button

    private var studentId: String? = null

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        progressBar = view.findViewById(R.id.parentReportsProgress)
        contentGroup = view.findViewById(R.id.parentReportsContent)
        textStudentName = view.findViewById(R.id.parentReportsStudentName)
        textStudentClass = view.findViewById(R.id.parentReportsStudentClass)
        buttonViewLatestReport = view.findViewById(R.id.buttonViewLatestReport)

        buttonViewLatestReport.setOnClickListener {
            studentId?.let {
                parentFragmentManager.beginTransaction()
                    .replace(R.id.fragmentContainer, StudentReportFragment.newInstance(it, null, null))
                    .addToBackStack(null)
                    .commit()
            }
        }

        loadParentStudent()
    }

    private fun loadParentStudent() {
        lifecycleScope.launch {
            showLoading(true)
            try {
                val response = RetrofitClient.api.getParentStudent()
                if (response.isSuccessful) {
                    response.body()?.let(this@ParentReportsFragment::displayStudent)
                }
            } catch (error: Exception) {
                // ignore and allow retry if needed
            } finally {
                showLoading(false)
            }
        }
    }

    private fun displayStudent(student: Student) {
        studentId = student.studentId
        textStudentName.text = "${student.firstName} ${student.lastName}"
        textStudentClass.text = student.classId ?: "N/A"
    }

    private fun showLoading(isLoading: Boolean) {
        progressBar.visibility = if (isLoading) View.VISIBLE else View.GONE
        contentGroup.visibility = if (isLoading) View.GONE else View.VISIBLE
    }
}
