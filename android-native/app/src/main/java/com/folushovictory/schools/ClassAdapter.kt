package com.folushovictory.schools

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.folushovictory.schools.models.Class

class ClassAdapter(
    private val classes: List<Class>,
    private val onClassClick: (Class) -> Unit
) : RecyclerView.Adapter<ClassAdapter.ClassViewHolder>() {

    class ClassViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val tvClassName: TextView = itemView.findViewById(R.id.tvClassName)
        val tvClassLevel: TextView = itemView.findViewById(R.id.tvClassLevel)
        val tvClassTrack: TextView = itemView.findViewById(R.id.tvClassTrack)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ClassViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_class, parent, false)
        return ClassViewHolder(view)
    }

    override fun onBindViewHolder(holder: ClassViewHolder, position: Int) {
        val schoolClass = classes[position]
        holder.tvClassName.text = schoolClass.name
        holder.tvClassLevel.text = schoolClass.level
        holder.tvClassTrack.text = schoolClass.track ?: "Teacher assigned"
        holder.itemView.setOnClickListener { onClassClick(schoolClass) }
    }

    override fun getItemCount() = classes.size
}
