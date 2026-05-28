package com.folushovictory.schools

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.folushovictory.schools.models.Score

class ScoreAdapter(
    private val scores: List<Score>
) : RecyclerView.Adapter<ScoreAdapter.ScoreViewHolder>() {

    class ScoreViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val tvStudentId: TextView = itemView.findViewById(R.id.tvStudentId)
        val etCA1: EditText = itemView.findViewById(R.id.etCA1)
        val etCA2: EditText = itemView.findViewById(R.id.etCA2)
        val etExam: EditText = itemView.findViewById(R.id.etExam)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ScoreViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_score_entry, parent, false)
        return ScoreViewHolder(view)
    }

    override fun onBindViewHolder(holder: ScoreViewHolder, position: Int) {
        val score = scores[position]
        holder.tvStudentId.text = score.studentId
        holder.etCA1.setText(score.ca1?.toString() ?: "")
        holder.etCA2.setText(score.ca2?.toString() ?: "")
        holder.etExam.setText(score.exam?.toString() ?: "")
    }

    override fun getItemCount(): Int = scores.size
}
