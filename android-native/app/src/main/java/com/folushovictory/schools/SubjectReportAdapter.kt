package com.folushovictory.schools

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.folushovictory.schools.models.SubjectReportRow

class SubjectReportAdapter(private val items: List<SubjectReportRow>) : RecyclerView.Adapter<SubjectReportAdapter.SubjectViewHolder>() {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): SubjectViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_report_subject, parent, false)
        return SubjectViewHolder(view)
    }

    override fun onBindViewHolder(holder: SubjectViewHolder, position: Int) {
        holder.bind(items[position])
    }

    override fun getItemCount(): Int = items.size

    class SubjectViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val subjectName: TextView = itemView.findViewById(R.id.subjectName)
        private val ca1Value: TextView = itemView.findViewById(R.id.ca1Value)
        private val ca2Value: TextView = itemView.findViewById(R.id.ca2Value)
        private val examValue: TextView = itemView.findViewById(R.id.examValue)
        private val totalValue: TextView = itemView.findViewById(R.id.totalValue)
        private val gradeValue: TextView = itemView.findViewById(R.id.gradeValue)

        fun bind(item: SubjectReportRow) {
            subjectName.text = item.subjectName ?: "Unknown Subject"
            ca1Value.text = item.ca1?.toString() ?: "-"
            ca2Value.text = item.ca2?.toString() ?: "-"
            examValue.text = item.exam?.toString() ?: "-"
            totalValue.text = item.total?.toString() ?: "-"
            gradeValue.text = item.grade ?: "-"
        }
    }
}
