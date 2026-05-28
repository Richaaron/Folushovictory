package com.folushovictory.schools

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.google.gson.JsonObject

class SimpleJsonAdapter(private val json: JsonObject) : RecyclerView.Adapter<SimpleJsonAdapter.ViewHolder>() {
    private val keys = json.keySet().toList()

    class ViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val tvLine: TextView = itemView.findViewById(android.R.id.text1)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(android.R.layout.simple_list_item_1, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val key = keys[position]
        val value = json.get(key).toString()
        holder.tvLine.text = "$key: $value"
    }

    override fun getItemCount(): Int = keys.size
}
