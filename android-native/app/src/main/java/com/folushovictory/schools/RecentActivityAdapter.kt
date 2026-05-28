package com.folushovictory.schools

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.folushovictory.schools.models.ActivityLog

class RecentActivityAdapter(
    private val items: List<ActivityLog>
) : RecyclerView.Adapter<RecentActivityAdapter.ActivityViewHolder>() {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ActivityViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_activity_log, parent, false)
        return ActivityViewHolder(view)
    }

    override fun onBindViewHolder(holder: ActivityViewHolder, position: Int) {
        holder.bind(items[position])
    }

    override fun getItemCount(): Int = items.size

    class ActivityViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        private val tvActor: TextView = view.findViewById(R.id.tvActor)
        private val tvAction: TextView = view.findViewById(R.id.tvAction)
        private val tvDetails: TextView = view.findViewById(R.id.tvDetails)
        private val tvCreatedAt: TextView = view.findViewById(R.id.tvCreatedAt)
        private val btnDelete: Button = view.findViewById(R.id.btnDeleteLog)

        fun bind(log: ActivityLog) {
            tvActor.text = "${log.actor} (${log.role})"
            tvAction.text = log.action
            tvDetails.text = log.details?.toString() ?: ""
            tvCreatedAt.text = log.createdAt ?: ""
            btnDelete.visibility = View.GONE
        }
    }
}
