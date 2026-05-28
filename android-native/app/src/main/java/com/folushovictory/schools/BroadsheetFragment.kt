package com.folushovictory.schools

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import android.widget.HorizontalScrollView
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.folushovictory.schools.api.RetrofitClient
import com.folushovictory.schools.models.BroadsheetResponse
import com.google.gson.Gson
import com.google.gson.JsonObject
import kotlinx.coroutines.launch

class BroadsheetFragment : Fragment() {
    private lateinit var classIdInput: EditText
    private lateinit var sessionInput: EditText
    private lateinit var termInput: EditText
    private lateinit var btnLoad: Button
    private lateinit var tvHeader: TextView
    private lateinit var btnSortAvg: Button
    private lateinit var btnSortTotal: Button
    private lateinit var btnExportCsv: Button
    private lateinit var hvHeaderSubjects: HorizontalScrollView
    private lateinit var headerSubjects: ViewGroup
    private lateinit var rvBroadsheet: RecyclerView
    private lateinit var progressBar: ProgressBar

    private val registeredHvs = mutableListOf<HorizontalScrollView>()
    private val studentJsonList = mutableListOf<com.google.gson.JsonObject>()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_broadsheet, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        classIdInput = view.findViewById(R.id.inputBroadsheetClassId)
        sessionInput = view.findViewById(R.id.inputBroadsheetSession)
        termInput = view.findViewById(R.id.inputBroadsheetTerm)
        btnLoad = view.findViewById(R.id.btnLoadBroadsheet)
        tvHeader = view.findViewById(R.id.tvBroadsheetHeader)
        btnSortAvg = view.findViewById(R.id.btnSortAvg)
        btnSortTotal = view.findViewById(R.id.btnSortTotal)
        btnExportCsv = view.findViewById(R.id.btnExportCsv)
        hvHeaderSubjects = view.findViewById(R.id.hvHeaderSubjects)
        headerSubjects = view.findViewById(R.id.headerSubjects)
        rvBroadsheet = view.findViewById(R.id.rvBroadsheet)
        progressBar = view.findViewById(R.id.broadsheetProgress)

        rvBroadsheet.layoutManager = LinearLayoutManager(requireContext())

        btnLoad.setOnClickListener { loadBroadsheet() }

        btnSortAvg.setOnClickListener {
            studentJsonList.sortWith(compareByDescending { it.get("average")?.asDouble ?: 0.0 })
            rvBroadsheet.adapter?.notifyDataSetChanged()
        }

        btnSortTotal.setOnClickListener {
            studentJsonList.sortWith(compareByDescending { it.get("total")?.asDouble ?: 0.0 })
            rvBroadsheet.adapter?.notifyDataSetChanged()
        }

        btnExportCsv.setOnClickListener { exportCsv() }
        // prefill from args if provided
        arguments?.let { args ->
            val cid = args.getString(ARG_CLASS_ID)
            val sess = args.getString(ARG_SESSION)
            val trm = args.getString(ARG_TERM)
            cid?.let { classIdInput.setText(it) }
            sess?.let { sessionInput.setText(it) }
            trm?.let { termInput.setText(it) }
            if (!cid.isNullOrBlank() && !sess.isNullOrBlank() && !trm.isNullOrBlank()) {
                loadBroadsheet()
            }
        }
    }

    companion object {
        private const val ARG_CLASS_ID = "classId"
        private const val ARG_SESSION = "session"
        private const val ARG_TERM = "term"

        fun newInstance(classId: String, session: String, term: String): BroadsheetFragment {
            val frag = BroadsheetFragment()
            val b = Bundle()
            b.putString(ARG_CLASS_ID, classId)
            b.putString(ARG_SESSION, session)
            b.putString(ARG_TERM, term)
            frag.arguments = b
            return frag
        }
    }

    private fun loadBroadsheet() {
        val classId = classIdInput.text.toString().trim()
        val session = sessionInput.text.toString().trim()
        val term = termInput.text.toString().trim()
        if (classId.isBlank() || session.isBlank() || term.isBlank()) {
            Toast.makeText(requireContext(), "Provide class ID, session and term", Toast.LENGTH_SHORT).show()
            return
        }

        progressBar.visibility = View.VISIBLE
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.api.getClassBroadsheet(classId, session, term)
                if (response.isSuccessful && response.body() != null) {
                    val body: JsonObject = response.body()!!
                    renderBroadsheet(body)
                } else {
                    Toast.makeText(requireContext(), "Failed to load broadsheet", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Error: ${e.message}", Toast.LENGTH_LONG).show()
            } finally {
                progressBar.visibility = View.GONE
            }
        }
    }

    private fun exportCsv() {
        if (studentJsonList.isEmpty()) {
            Toast.makeText(requireContext(), "No data to export", Toast.LENGTH_SHORT).show()
            return
        }

        val subjects = mutableListOf<String>()
        val headerArr = headerSubjects
        for (i in 0 until headerArr.childCount) {
            val tv = headerArr.getChildAt(i) as? TextView
            tv?.text?.let { subjects.add(it.toString()) }
        }

        val sb = StringBuilder()
        // header
        sb.append("StudentId,Name")
        for (s in subjects) sb.append(",\"").append(s.replace("\"", "\"\"")).append("\"")
        sb.append(",Total,Average,Position\n")

        for (stu in studentJsonList) {
            val sid = stu.get("studentId")?.asString ?: ""
            val name = ((stu.get("lastName")?.asString ?: "") + " " + (stu.get("firstName")?.asString ?: "")).trim()
            sb.append(sid).append(",\"").append(name.replace("\"", "\"\"")).append("\"")
            val perSubject = stu.getAsJsonArray("perSubject")
            if (perSubject != null) {
                for (ps in perSubject) {
                    val p = ps.asJsonObject
                    val tot = p.get("total")?.asNumber?.toString() ?: ""
                    sb.append(",").append(tot)
                }
            } else {
                for (i in subjects.indices) sb.append(",")
            }
            sb.append(",${stu.get("total")?.asNumber?.toString() ?: ""},${stu.get("average")?.asNumber?.toString() ?: ""},${stu.get("position")?.asNumber?.toString() ?: ""}\n")
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

    private fun renderBroadsheet(body: JsonObject) {
        val gson = Gson()
        val jsonStr = body.toString()
        // Parse into our response model. We adapt the `class` field name to `classInfo` afterwards.
        val raw = gson.fromJson(jsonStr, BroadsheetResponse::class.java)

        // Some fields come directly; class is returned as `class`, which conflicts with Kotlin keyword mapping,
        // so fallback to reading from JsonObject when necessary.
        val className = body.getAsJsonObject("class")?.get("name")?.asString ?: (raw.classInfo?.get("name") as? String ?: "Class")
        val session = raw.session.ifEmpty { body.get("session")?.asString ?: "" }
        val term = raw.term.ifEmpty { body.get("term")?.asString ?: "" }
        val published = raw.published || (body.get("published")?.asBoolean ?: false)

        tvHeader.text = "$className — $session $term ${if (published) "(Published)" else ""}"

        // Build adapter with subjects headers and student rows
        val subjects = mutableListOf<String>()
        val subjectsArray = body.getAsJsonArray("subjects")
        if (subjectsArray != null) {
            for (s in subjectsArray) {
                val so = s.asJsonObject
                subjects.add(so.get("name")?.asString ?: so.get("id")?.asString ?: "")
            }
        }

        // populate header subjects
        headerSubjects.removeAllViews()
        for (sub in subjects) {
            val tv = TextView(requireContext()).apply {
                text = sub
                setTextColor(0xFFFFFFFF.toInt())
                setPadding(24, 8, 24, 8)
            }
            headerSubjects.addView(tv)
        }

        // Build list of student JsonObjects to feed adapter
        studentJsonList.clear()
        val studentsArray = body.getAsJsonArray("students")
        if (studentsArray != null) {
            for (elem in studentsArray) {
                studentJsonList.add(elem.asJsonObject)
            }
        }

        // setup adapter and pass register callback so rows can register their HVs
        rvBroadsheet.adapter = BroadsheetAdapter(studentJsonList, subjects) { hv ->
            // register hv and sync its scroll to header
            if (!registeredHvs.contains(hv)) registeredHvs.add(hv)
            hv.viewTreeObserver.addOnScrollChangedListener {
                val sx = hv.scrollX
                // propagate to others
                hvHeaderSubjects.scrollTo(sx, 0)
                for (other in registeredHvs) {
                    if (other !== hv) other.scrollTo(sx, 0)
                }
            }
        }

        // header scroll sync: propagate header HV to rows
        hvHeaderSubjects.viewTreeObserver.addOnScrollChangedListener {
            val sx = hvHeaderSubjects.scrollX
            for (other in registeredHvs) other.scrollTo(sx, 0)
        }
    }
}

    class BroadsheetAdapter(
        private val students: List<com.google.gson.JsonObject>,
        private val subjects: List<String>,
        private val registerHv: (android.widget.HorizontalScrollView) -> Unit
    ) : RecyclerView.Adapter<BroadsheetAdapter.RowHolder>() {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RowHolder {
        val v = LayoutInflater.from(parent.context).inflate(R.layout.item_broadsheet_row, parent, false)
        return RowHolder(v, registerHv)
    }

    override fun onBindViewHolder(holder: RowHolder, position: Int) {
        holder.bind(students[position], subjects)
    }

    override fun getItemCount(): Int = students.size

    class RowHolder(view: View, private val registerHv: (android.widget.HorizontalScrollView) -> Unit) : RecyclerView.ViewHolder(view) {
        private val tvName: TextView = view.findViewById(R.id.tvStudentName)
        private val tvTotal: TextView = view.findViewById(R.id.tvTotal)
        private val tvAvg: TextView = view.findViewById(R.id.tvAverage)
        private val subjectContainer: ViewGroup = view.findViewById(R.id.subjectContainer)

        fun bind(obj: com.google.gson.JsonObject, subjects: List<String>) {
            val name = ((obj.get("lastName")?.asString ?: "") + " " + (obj.get("firstName")?.asString ?: "")).trim()
            tvName.text = name
            tvTotal.text = "Total: ${obj.get("total")?.asNumber?.toString() ?: ""}"
            tvAvg.text = "Avg: ${obj.get("average")?.asNumber?.toString() ?: ""}"

            val hv: android.widget.HorizontalScrollView = itemView.findViewById(R.id.hvSubjects)
            registerHv(hv)

            subjectContainer.removeAllViews()
            val perSubject = obj.getAsJsonArray("perSubject")
            if (perSubject != null) {
                for (ps in perSubject) {
                    val p = ps.asJsonObject
                    val subName = p.get("subjectName")?.asString ?: p.get("subjectId")?.asString ?: ""
                    val tot = p.get("total")?.asNumber?.toString() ?: ""
                    val pos = p.get("subjectPosition")?.asNumber?.toString() ?: ""

                    val tv = TextView(itemView.context).apply {
                        text = "$subName: $tot${if (pos.isNotEmpty()) " (#$pos)" else ""}"
                        setTextColor(0xFFE5E7EB.toInt())
                        setPadding(12, 6, 12, 6)
                    }
                    subjectContainer.addView(tv)
                }
            } else {
                // If no perSubject array, show placeholder for each subject name
                for (s in subjects) {
                    val tv = TextView(itemView.context).apply {
                        text = s
                        setTextColor(0xFF94A3B8.toInt())
                        setPadding(12, 6, 12, 6)
                    }
                    subjectContainer.addView(tv)
                }
            }
        }
    }
}

    // Adapter methods are implemented in the BroadsheetAdapter class above.
