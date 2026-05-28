package com.folushovictory.schools

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.folushovictory.schools.api.RetrofitClient
import com.folushovictory.schools.models.GradeScaleEntry
import com.folushovictory.schools.models.GradingScaleRequest
import kotlinx.coroutines.launch

class AdminGradingScaleFragment : Fragment() {
    private lateinit var inputGradingScale: EditText
    private lateinit var btnSaveGradingScale: Button

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {
        return inflater.inflate(R.layout.fragment_admin_grading_scale, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        inputGradingScale = view.findViewById(R.id.inputGradingScale)
        btnSaveGradingScale = view.findViewById(R.id.btnSaveGradingScale)

        btnSaveGradingScale.setOnClickListener { saveGradingScale() }
        loadGradingScale()
    }

    private fun loadGradingScale() {
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.api.getGradingScale()
                if (response.isSuccessful) {
                    val scale = response.body()
                    if (scale != null && scale.grades.isNotEmpty()) {
                        inputGradingScale.setText(
                            scale.grades.joinToString(separator = "\n") { grade ->
                                listOf(grade.letter, grade.min.toString(), grade.max.toString(), grade.remark.orEmpty())
                                    .filter { it.isNotBlank() }
                                    .joinToString(" ")
                            }
                        )
                    }
                } else {
                    Toast.makeText(requireContext(), "Unable to load grading scale", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Error: ${e.message}", Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun saveGradingScale() {
        val lines = inputGradingScale.text.toString().trim().lines().map { it.trim() }.filter { it.isNotBlank() }
        if (lines.isEmpty()) {
            Toast.makeText(requireContext(), "Enter at least one grading scale entry", Toast.LENGTH_SHORT).show()
            return
        }

        val grades = mutableListOf<GradeScaleEntry>()
        for ((index, line) in lines.withIndex()) {
            val parts = line.split(Regex("\\s+"), limit = 4)
            if (parts.size < 3) {
                Toast.makeText(requireContext(), "Invalid format on line ${index + 1}. Use LETTER MIN MAX [REMARK]", Toast.LENGTH_LONG).show()
                return
            }
            val letter = parts[0].trim()
            val min = parts[1].toIntOrNull()
            val max = parts[2].toIntOrNull()
            val remark = if (parts.size == 4) parts[3].trim() else null
            if (letter.isBlank() || min == null || max == null) {
                Toast.makeText(requireContext(), "Invalid values on line ${index + 1}. Use LETTER MIN MAX [REMARK]", Toast.LENGTH_LONG).show()
                return
            }
            grades.add(GradeScaleEntry(letter = letter, min = min, max = max, remark = remark))
        }

        lifecycleScope.launch {
            try {
                val response = RetrofitClient.api.setGradingScale(GradingScaleRequest(grades = grades))
                if (response.isSuccessful) {
                    Toast.makeText(requireContext(), "Grading scale saved", Toast.LENGTH_SHORT).show()
                } else {
                    Toast.makeText(requireContext(), "Failed to save grading scale", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Error: ${e.message}", Toast.LENGTH_LONG).show()
            }
        }
    }
}
