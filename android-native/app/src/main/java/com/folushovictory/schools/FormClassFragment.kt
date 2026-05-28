package com.folushovictory.schools

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ProgressBar
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.folushovictory.schools.api.RetrofitClient
import kotlinx.coroutines.launch

class FormClassFragment : Fragment() {
    private lateinit var rvFormClasses: RecyclerView
    private lateinit var progressBar: ProgressBar

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_form_classes, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        rvFormClasses = view.findViewById(R.id.rvFormClasses)
        progressBar = view.findViewById(R.id.progressBar)
        rvFormClasses.layoutManager = LinearLayoutManager(requireContext())
        loadFormClasses()
    }

    private fun loadFormClasses() {
        progressBar.visibility = View.VISIBLE
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.api.getTeacherFormClasses()
                if (response.isSuccessful && response.body() != null) {
                    val classes = response.body()!!.classes
                    rvFormClasses.adapter = ClassAdapter(classes) { selectedClass ->
                        Toast.makeText(
                            requireContext(),
                            "Selected form class: ${selectedClass.name}",
                            Toast.LENGTH_SHORT
                        ).show()
                    }
                } else {
                    Toast.makeText(requireContext(), "Unable to load form classes", Toast.LENGTH_SHORT).show()
                    rvFormClasses.adapter = ClassAdapter(emptyList()) {}
                }
            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Error: ${e.message}", Toast.LENGTH_LONG).show()
            } finally {
                progressBar.visibility = View.GONE
            }
        }
    }
}
