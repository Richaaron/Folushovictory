package com.folushovictory.schools

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.folushovictory.schools.api.RetrofitClient
import com.folushovictory.schools.models.Assignment
import com.google.android.material.floatingactionbutton.FloatingActionButton
import kotlinx.coroutines.launch

class ResultsFragment : Fragment() {
    private lateinit var recyclerView: RecyclerView
    private lateinit var fabAdd: FloatingActionButton
    private var assignments: List<Assignment> = emptyList()

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
            openFirstAvailableAssignment()
        }

        loadAssignments()
    }

    private fun loadAssignments() {
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.api.getTeacherAssignments()
                if (response.isSuccessful && response.body() != null) {
                    assignments = response.body()!!.assignments
                    recyclerView.adapter = AssignmentAdapter(assignments) { assignment ->
                        openScoreEntryForAssignment(assignment)
                    }
                } else {
                    Toast.makeText(requireContext(), "Failed to load assignments", Toast.LENGTH_SHORT).show()
                    assignments = emptyList()
                    recyclerView.adapter = AssignmentAdapter(emptyList()) {}
                }
            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun openFirstAvailableAssignment() {
        if (assignments.isEmpty()) {
            Toast.makeText(requireContext(), "No assignments available yet. Tap an assignment to enter scores.", Toast.LENGTH_SHORT).show()
            return
        }

        openScoreEntryForAssignment(assignments[0])
    }

    private fun openScoreEntryForAssignment(assignment: Assignment) {
        val fragment = ScoreEntryFragment.newInstance(
            assignment.classId,
            assignment.subjectId,
            assignment.className ?: "Class",
            assignment.subjectName ?: "Subject"
        )

        parentFragmentManager.beginTransaction()
            .replace(R.id.fragmentContainer, fragment)
            .addToBackStack(null)
            .commit()
    }
}
