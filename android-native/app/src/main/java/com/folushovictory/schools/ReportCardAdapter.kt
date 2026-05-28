package com.folushovictory.schools

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.folushovictory.schools.models.ReportCard

class ReportCardAdapter(
    private val reportCards: List<ReportCard>
) : RecyclerView.Adapter<ReportCardAdapter.ReportCardViewHolder>() {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ReportCardViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_report_card, parent, false)
        return ReportCardViewHolder(view)
    }

    override fun onBindViewHolder(holder: ReportCardViewHolder, position: Int) {
        holder.bind(reportCards[position])
    }

    override fun getItemCount(): Int = reportCards.size

    class ReportCardViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        private val tvReportTitle: TextView = view.findViewById(R.id.tvReportTitle)
        private val tvReportSubtitle: TextView = view.findViewById(R.id.tvReportSubtitle)
        private val tvAverageGrade: TextView = view.findViewById(R.id.tvAverageGrade)
        private val tvStatus: TextView = view.findViewById(R.id.tvStatus)
        private val tvPosition: TextView = view.findViewById(R.id.tvPosition)

        fun bind(card: ReportCard) {
            tvReportTitle.text = "${card.term} Report"
            tvReportSubtitle.text = "${card.session} • ${card.term}"
            tvAverageGrade.text = "Average: ${card.averageGrade}"
            tvStatus.text = card.status.capitalize()
            tvPosition.text = "Position: ${card.position ?: "--"}"
        }
    }
}
