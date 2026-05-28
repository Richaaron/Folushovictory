package com.folushovictory.schools

import android.os.Bundle
import android.text.InputType
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.folushovictory.schools.api.RetrofitClient
import com.folushovictory.schools.models.Class as SchoolClass
import com.folushovictory.schools.models.ClassCreateRequest
import com.folushovictory.schools.models.ClassUpdateRequest
import com.google.android.material.floatingactionbutton.FloatingActionButton
import kotlinx.coroutines.launch

class ClassesFragment : Fragment() {
    private lateinit var recyclerView: RecyclerView
    private lateinit var fabAdd: FloatingActionButton

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_list, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        recyclerView = view.findViewById(R.id.recyclerView)
        recyclerView.layoutManager = LinearLayoutManager(requireContext())

        fabAdd = view.findViewById(R.id.fabAdd)
        fabAdd.setOnClickListener {
            showClassDialog()
        }

        loadClasses()
    }

    private fun loadClasses() {
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.api.getClasses()
                if (response.isSuccessful && response.body() != null) {
                    val classes = response.body()!!.classes
                    recyclerView.adapter = ClassAdapter(classes) { schoolClass ->
                        showClassDialog(schoolClass)
                    }
                } else {
                    Toast.makeText(requireContext(), "Failed to load classes", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun showClassDialog(schoolClass: SchoolClass? = null) {
        val title = if (schoolClass == null) "Add Class" else "Edit Class"

        val nameInput = EditText(requireContext()).apply {
            hint = "Class name"
            inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_FLAG_CAP_WORDS
            setText(schoolClass?.name ?: "")
        }
        val levelInput = EditText(requireContext()).apply {
            hint = "Level"
            inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_FLAG_CAP_WORDS
            setText(schoolClass?.level ?: "")
        }
        val trackInput = EditText(requireContext()).apply {
            hint = "Track (optional)"
            inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_FLAG_CAP_WORDS
            setText(schoolClass?.track ?: "")
        }

        val container = LinearLayout(requireContext()).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(32, 24, 32, 0)
            addView(nameInput)
            addView(levelInput)
            addView(trackInput)
        }

        AlertDialog.Builder(requireContext())
            .setTitle(title)
            .setView(container)
            .setPositiveButton("Save") { _, _ ->
                val name = nameInput.text.toString().trim()
                val level = levelInput.text.toString().trim()
                val track = trackInput.text.toString().trim().takeIf { it.isNotEmpty() }
                if (name.isBlank() || level.isBlank()) {
                    Toast.makeText(requireContext(), "Class name and level are required", Toast.LENGTH_SHORT).show()
                    return@setPositiveButton
                }

                lifecycleScope.launch {
                    try {
                        if (schoolClass == null) {
                            val request = ClassCreateRequest(name = name, level = level, track = track)
                            val createResponse = RetrofitClient.api.createClass(request)
                            if (createResponse.isSuccessful) {
                                Toast.makeText(requireContext(), "Class created", Toast.LENGTH_SHORT).show()
                                loadClasses()
                            } else {
                                Toast.makeText(requireContext(), "Failed to create class", Toast.LENGTH_SHORT).show()
                            }
                        } else {
                            val request = ClassUpdateRequest(name = name, level = level, track = track)
                            val updateResponse = RetrofitClient.api.updateClass(schoolClass.id, request)
                            if (updateResponse.isSuccessful) {
                                Toast.makeText(requireContext(), "Class updated", Toast.LENGTH_SHORT).show()
                                loadClasses()
                            } else {
                                Toast.makeText(requireContext(), "Failed to update class", Toast.LENGTH_SHORT).show()
                            }
                        }
                    } catch (e: Exception) {
                        Toast.makeText(requireContext(), "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                    }
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
}
