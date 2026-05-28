package com.folushovictory.schools

import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView

class ScoreEntryAdapter(
    private val rows: List<ScoreEntryFragment.StudentScoreRow>
) : RecyclerView.Adapter<ScoreEntryAdapter.ScoreViewHolder>() {

    class ScoreViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val tvStudentName: TextView = itemView.findViewById(R.id.tvStudentName)
        val tvStudentId: TextView = itemView.findViewById(R.id.tvStudentId)
        val etCA1: EditText = itemView.findViewById(R.id.etCA1)
        val etCA2: EditText = itemView.findViewById(R.id.etCA2)
        val etExam: EditText = itemView.findViewById(R.id.etExam)

        var ca1Watcher: TextWatcher? = null
        var ca2Watcher: TextWatcher? = null
        var examWatcher: TextWatcher? = null
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ScoreViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_score_entry, parent, false)
        return ScoreViewHolder(view)
    }

    override fun onBindViewHolder(holder: ScoreViewHolder, position: Int) {
        val row = rows[position]

        holder.tvStudentName.text = "${row.student.firstName} ${row.student.lastName}"
        holder.tvStudentId.text = row.student.studentId

        holder.ca1Watcher?.let { holder.etCA1.removeTextChangedListener(it) }
        holder.ca2Watcher?.let { holder.etCA2.removeTextChangedListener(it) }
        holder.examWatcher?.let { holder.etExam.removeTextChangedListener(it) }

        holder.etCA1.setText(row.ca1?.toString() ?: "")
        holder.etCA2.setText(row.ca2?.toString() ?: "")
        holder.etExam.setText(row.exam?.toString() ?: "")

        holder.ca1Watcher = createTextWatcher { text ->
            val raw = text.toDoubleOrNull() ?: 0.0
            row.ca1 = raw.coerceIn(0.0, 20.0)
            if (raw > 20) holder.etCA1.setText(String.format("%.0f", row.ca1))
        }
        holder.ca2Watcher = createTextWatcher { text ->
            val raw = text.toDoubleOrNull() ?: 0.0
            row.ca2 = raw.coerceIn(0.0, 20.0)
            if (raw > 20) holder.etCA2.setText(String.format("%.0f", row.ca2))
        }
        holder.examWatcher = createTextWatcher { text ->
            val raw = text.toDoubleOrNull() ?: 0.0
            row.exam = raw.coerceIn(0.0, 60.0)
            if (raw > 60) holder.etExam.setText(String.format("%.0f", row.exam))
        }

        holder.etCA1.addTextChangedListener(holder.ca1Watcher)
        holder.etCA2.addTextChangedListener(holder.ca2Watcher)
        holder.etExam.addTextChangedListener(holder.examWatcher)
    }

    override fun getItemCount() = rows.size

    private fun createTextWatcher(onValueChanged: (String) -> Unit): TextWatcher {
        return object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                onValueChanged(s?.toString().orEmpty())
            }
            override fun afterTextChanged(s: Editable?) {}
        }
    }
}
