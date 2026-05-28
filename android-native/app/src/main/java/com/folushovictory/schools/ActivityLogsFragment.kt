package com.folushovictory.schools

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.folushovictory.schools.api.RetrofitClient
import com.folushovictory.schools.models.ActivityLog
import com.folushovictory.schools.models.ActivityLogsResponse
import kotlinx.coroutines.launch

class ActivityLogsFragment : Fragment() {
    private lateinit var inputTeacher: EditText
    private lateinit var btnLoad: Button
    private lateinit var btnClear: Button
    private lateinit var rvLogs: RecyclerView

    private val logs = mutableListOf<ActivityLog>()

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {
        return inflater.inflate(R.layout.fragment_activity_logs, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        inputTeacher = view.findViewById(R.id.inputActivityTeacher)
        btnLoad = view.findViewById(R.id.btnLoadActivityLogs)
        btnClear = view.findViewById(R.id.btnClearActivityLogs)
        rvLogs = view.findViewById(R.id.rvActivityLogs)

        rvLogs.layoutManager = LinearLayoutManager(requireContext())
        rvLogs.adapter = LogsAdapter(logs) { id -> deleteLog(id) }

        btnLoad.setOnClickListener { loadLogs() }
        btnClear.setOnClickListener { clearLogs() }
    }

    private fun loadLogs() {
        val teacher = inputTeacher.text.toString().trim().ifEmpty { null }
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.api.getActivityLogs(teacher, 100)
                if (response.isSuccessful) {
                    val body: ActivityLogsResponse? = response.body()
                    logs.clear()
                    if (body != null) logs.addAll(body.logs)
                    rvLogs.adapter?.notifyDataSetChanged()
                } else {
                    Toast.makeText(requireContext(), "Failed to load logs", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Error: ${e.message}", Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun deleteLog(id: String) {
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.api.deleteActivityLog(id)
                if (response.isSuccessful) {
                    Toast.makeText(requireContext(), "Deleted", Toast.LENGTH_SHORT).show()
                    loadLogs()
                } else {
                    Toast.makeText(requireContext(), "Failed to delete", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Error: ${e.message}", Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun clearLogs() {
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.api.clearActivityLogs()
                if (response.isSuccessful) {
                    Toast.makeText(requireContext(), "Cleared all logs", Toast.LENGTH_SHORT).show()
                    loadLogs()
                } else {
                    Toast.makeText(requireContext(), "Failed to clear logs", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Error: ${e.message}", Toast.LENGTH_LONG).show()
            }
        }
    }
}

class LogsAdapter(private val items: List<ActivityLog>, private val onDelete: (String) -> Unit) : RecyclerView.Adapter<LogsAdapter.LogViewHolder>() {
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): LogViewHolder {
        val v = LayoutInflater.from(parent.context).inflate(R.layout.item_activity_log, parent, false)
        return LogViewHolder(v)
    }

    override fun onBindViewHolder(holder: LogViewHolder, position: Int) {
        holder.bind(items[position], onDelete)
    }

    override fun getItemCount(): Int = items.size

    class LogViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        private val tvActor: TextView = view.findViewById(R.id.tvActor)
        private val tvAction: TextView = view.findViewById(R.id.tvAction)
        private val tvDetails: TextView = view.findViewById(R.id.tvDetails)
        private val tvCreated: TextView = view.findViewById(R.id.tvCreatedAt)
        private val btnDelete: Button = view.findViewById(R.id.btnDeleteLog)

        fun bind(log: ActivityLog, onDelete: (String) -> Unit) {
            tvActor.text = "${log.actor} (${log.role})"
            tvAction.text = log.action
            tvDetails.text = log.details?.toString() ?: ""
            tvCreated.text = log.createdAt ?: ""
            btnDelete.setOnClickListener { onDelete(log.id) }
        }
    }
}
