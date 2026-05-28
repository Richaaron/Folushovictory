package com.folushovictory.schools

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.folushovictory.schools.models.Teacher

class TeacherAdapter(
    private val teachers: List<Teacher>,
    private val onTeacherClick: (Teacher) -> Unit
) : RecyclerView.Adapter<TeacherAdapter.TeacherViewHolder>() {
    
    class TeacherViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val tvName: TextView = itemView.findViewById(R.id.tvTeacherName)
        val tvUsername: TextView = itemView.findViewById(R.id.tvTeacherUsername)
    }
    
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): TeacherViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_teacher, parent, false)
        return TeacherViewHolder(view)
    }
    
    override fun onBindViewHolder(holder: TeacherViewHolder, position: Int) {
        val teacher = teachers[position]
        holder.tvName.text = teacher.displayName
        holder.tvUsername.text = teacher.username
        holder.itemView.setOnClickListener { onTeacherClick(teacher) }
    }
    
    override fun getItemCount() = teachers.size
}
