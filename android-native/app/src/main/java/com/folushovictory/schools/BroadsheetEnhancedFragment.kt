package com.folushovictory.schools

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.HorizontalScrollView
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import android.view.ViewGroup as AndroidViewGroup
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.folushovictory.schools.api.RetrofitClient
import com.google.gson.Gson
import com.google.gson.JsonObject
import kotlinx.coroutines.launch

class BroadsheetEnhancedFragment : Fragment() {
    private lateinit var rvBroadsheet: RecyclerView
    private lateinit var tvClassInfo: TextView
    private lateinit var btnExportCsv: Button
    private lateinit var progressBar: ProgressBar
    private lateinit var hvHeaderSubjects: HorizontalScrollView
    private lateinit var headerSubjects: AndroidViewGroup

    private var classId: String? = null
    private var session: String? = null
    private var term: String? = null
    private var broadsheetBody: JsonObject? = null
    private val registeredHvs = mutableListOf<HorizontalScrollView>()
    private val studentJsonList = mutableListOf<JsonObject>()
    private val subjects = mutableListOf<String>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        arguments?.let {
            classId = it.getString(ARG_CLASS_ID)
            session = it.getString(ARG_SESSION)
            term = it.getString(ARG_TERM)
        }
    }

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {
        return inflater.inflate(R.layout.fragment_broadsheet_enhanced, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        rvBroadsheet = view.findViewById(R.id.rvBroadsheet)
        tvClassInfo = view.findViewById(R.id.tvClassInfo)
        btnExportCsv = view.findViewById(R.id.btnExportCsv)
        progressBar = view.findViewById(R.id.progressBar)
        hvHeaderSubjects = view.findViewById(R.id.hvHeaderSubjects)
        headerSubjects = view.findViewById(R.id.headerSubjects)

        rvBroadsheet.layoutManager = LinearLayoutManager(requireContext())

        btnExportCsv.setOnClickListener {
            exportCsv()
        }

        loadBroadsheet()
    }

    private fun loadBroadsheet() {
        val cId = classId ?: return
        progressBar.visibility = View.VISIBLE
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.api.getClassBroadsheet(cId, session ?: "", term ?: "")
                if (response.isSuccessful && response.body() != null) {
                    broadsheetBody = response.body()!!
                    tvClassInfo.text = "Broadsheet for class $cId"
                    renderBroadsheet(response.body()!!)
                } else {
                    Toast.makeText(requireContext(), "Unable to load broadsheet", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Error: ${e.message}", Toast.LENGTH_LONG).show()
            } finally {
                progressBar.visibility = View.GONE
            }
        }
    }

    private fun renderBroadsheet(body: JsonObject) {
        subjects.clear()
        headerSubjects.removeAllViews()
        studentJsonList.clear()

        val subjectsArray = body.getAsJsonArray("subjects")
        if (subjectsArray != null) {
            for (subject in subjectsArray) {
                val subjectObj = subject.asJsonObject
                val subjectName = subjectObj.get("name")?.asString ?: subjectObj.get("id")?.asString ?: ""
                subjects.add(subjectName)
            }
        }

        for (subjectName in subjects) {
            val tv = TextView(requireContext()).apply {
                text = subjectName
                setTextColor(0xFFFFFFFF.toInt())
                setPadding(24, 8, 24, 8)
            }
            headerSubjects.addView(tv)
        }

        val students = body.getAsJsonArray("students")
        if (students != null) {
            for (student in students) {
                studentJsonList.add(student.asJsonObject)
            }
        }

        rvBroadsheet.adapter = BroadsheetAdapter(studentJsonList, subjects) { hv ->
            if (!registeredHvs.contains(hv)) registeredHvs.add(hv)
            hv.viewTreeObserver.addOnScrollChangedListener {
                val sx = hv.scrollX
                hvHeaderSubjects.scrollTo(sx, 0)
                for (other in registeredHvs) {
                    if (other !== hv) other.scrollTo(sx, 0)
                }
            }
        }

        hvHeaderSubjects.viewTreeObserver.addOnScrollChangedListener {
            val sx = hvHeaderSubjects.scrollX
            for (other in registeredHvs) {
                other.scrollTo(sx, 0)
            }
        }
    }

    private fun exportCsv() {
        val body = broadsheetBody
        if (body == null) {
            Toast.makeText(requireContext(), "Load broadsheet first", Toast.LENGTH_SHORT).show()
            return
        }

        val subjects = mutableListOf<String>()
        val subjectsArray = body.getAsJsonArray("subjects")
        if (subjectsArray != null) {
            for (subject in subjectsArray) {
                val subjectObj = subject.asJsonObject
                subjects.add(subjectObj.get("name")?.asString ?: subjectObj.get("id")?.asString ?: "")
            }
        }

        val students = body.getAsJsonArray("students")
        if (students == null || students.size() == 0) {
            Toast.makeText(requireContext(), "No student data available", Toast.LENGTH_SHORT).show()
            return
        }

        val sb = StringBuilder()
        sb.append("StudentId,Name")
        for (subjectName in subjects) {
            sb.append(",\"").append(subjectName.replace("\"", "\"\"")).append("\"")
        }
        sb.append(",Total,Average,Position\n")

        for (student in students) {
            val stuObj = student.asJsonObject
            val studentId = stuObj.get("studentId")?.asString ?: ""
            val name = ((stuObj.get("lastName")?.asString ?: "") + " " + (stuObj.get("firstName")?.asString ?: "")).trim()
            sb.append(studentId)
                .append(",\"").append(name.replace("\"", "\"\"")).append("\"")

            val perSubject = stuObj.getAsJsonArray("perSubject")
            if (perSubject != null) {
                for (subjectScore in perSubject) {
                    val scoreObj = subjectScore.asJsonObject
                    val total = scoreObj.get("total")?.asNumber?.toString() ?: ""
                    sb.append(",").append(total)
                }
            } else {
                for (i in subjects.indices) {
                    sb.append(",")
                }
            }

            sb.append(",${stuObj.get("total")?.asNumber?.toString() ?: ""}")
            sb.append(",${stuObj.get("average")?.asNumber?.toString() ?: ""}")
            sb.append(",${stuObj.get("position")?.asNumber?.toString() ?: ""}")
            sb.append("\n")
        }

        val csv = sb.toString()
        val send = android.content.Intent().apply {
            action = android.content.Intent.ACTION_SEND
            putExtra(android.content.Intent.EXTRA_SUBJECT, "Broadsheet export")
            putExtra(android.content.Intent.EXTRA_TEXT, csv)
            type = "text/csv"
        }
        startActivity(android.content.Intent.createChooser(send, "Share CSV"))
    }

    companion object {
        private const val ARG_CLASS_ID = "classId"
        private const val ARG_SESSION = "session"
        private const val ARG_TERM = "term"

        fun newInstance(classId: String, session: String, term: String): BroadsheetEnhancedFragment {
            val f = BroadsheetEnhancedFragment()
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
