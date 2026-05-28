package com.folushovictory.schools

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.folushovictory.schools.models.Assignment

class AssignmentAdapter(
    private val assignments: List<Assignment>,
    private val onAssignmentClick: (Assignment) -> Unit
) : RecyclerView.Adapter<AssignmentAdapter.AssignmentViewHolder>() {

    class AssignmentViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val tvSubjectName: TextView = itemView.findViewById(R.id.tvSubjectName)
        val tvClassName: TextView = itemView.findViewById(R.id.tvClassName)
        val tvLevel: TextView = itemView.findViewById(R.id.tvLevel)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): AssignmentViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_assignment, parent, false)
        return AssignmentViewHolder(view)
    }

    override fun onBindViewHolder(holder: AssignmentViewHolder, position: Int) {
        val assignment = assignments[position]
        holder.tvSubjectName.text = assignment.subjectName ?: "Unknown subject"
        holder.tvClassName.text = assignment.className ?: "Unknown class"
        holder.tvLevel.text = assignment.level ?: "Level not available"
        holder.itemView.setOnClickListener { onAssignmentClick(assignment) }
    }

    override fun getItemCount() = assignments.size
}
