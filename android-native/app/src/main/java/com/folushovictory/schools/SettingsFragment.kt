package com.folushovictory.schools

import android.content.Intent
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
import com.folushovictory.schools.models.ChangePasswordRequest
import com.folushovictory.schools.models.SchoolSettings
import com.folushovictory.schools.models.TermMetaRequest
import kotlinx.coroutines.launch

class SettingsFragment : Fragment() {
    private lateinit var nameInput: EditText
    private lateinit var mottoInput: EditText
    private lateinit var addressInput: EditText
    private lateinit var phoneInput: EditText
    private lateinit var emailInput: EditText
    private lateinit var websiteInput: EditText
    private lateinit var principalInput: EditText
    private lateinit var sessionInput: EditText
    private lateinit var termInput: EditText
    private lateinit var resumptionDateInput: EditText
    private lateinit var oldPasswordInput: EditText
    private lateinit var newPasswordInput: EditText

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_settings, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        nameInput = view.findViewById(R.id.inputSchoolName)
        mottoInput = view.findViewById(R.id.inputSchoolMotto)
        addressInput = view.findViewById(R.id.inputSchoolAddress)
        phoneInput = view.findViewById(R.id.inputSchoolPhone)
        emailInput = view.findViewById(R.id.inputSchoolEmail)
        websiteInput = view.findViewById(R.id.inputSchoolWebsite)
        principalInput = view.findViewById(R.id.inputPrincipalName)
        sessionInput = view.findViewById(R.id.inputCurrentSession)
        termInput = view.findViewById(R.id.inputCurrentTerm)
        resumptionDateInput = view.findViewById(R.id.inputResumptionDate)
        oldPasswordInput = view.findViewById(R.id.inputOldPassword)
        newPasswordInput = view.findViewById(R.id.inputNewPassword)

        val btnSaveSettings = view.findViewById<Button>(R.id.btnSaveSettings)
        val btnSaveTermMeta = view.findViewById<Button>(R.id.btnSaveTermMeta)
        val btnChangePassword = view.findViewById<Button>(R.id.btnChangePassword)
        val btnLogout = view.findViewById<Button>(R.id.btnLogout)

        btnSaveSettings.setOnClickListener { saveSchoolSettings() }
        btnSaveTermMeta.setOnClickListener { saveTermMeta() }
        btnChangePassword.setOnClickListener { changePassword() }
        btnLogout.setOnClickListener {
            RetrofitClient.saveToken("")
            val intent = Intent(requireActivity(), LoginActivity::class.java)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            startActivity(intent)
            requireActivity().finish()
        }

        loadSchoolSettings()
    }

    private fun changePassword() {
        val oldPassword = oldPasswordInput.text.toString().trim()
        val newPassword = newPasswordInput.text.toString().trim()

        if (oldPassword.isBlank() || newPassword.isBlank()) {
            Toast.makeText(requireContext(), "Both current and new passwords are required", Toast.LENGTH_SHORT).show()
            return
        }

        lifecycleScope.launch {
            try {
                val request = ChangePasswordRequest(oldPassword = oldPassword, newPassword = newPassword)
                val response = RetrofitClient.api.changePassword(request)
                if (response.isSuccessful) {
                    Toast.makeText(requireContext(), "Password changed successfully", Toast.LENGTH_SHORT).show()
                    oldPasswordInput.text?.clear()
                    newPasswordInput.text?.clear()
                } else {
                    Toast.makeText(requireContext(), "Failed to change password", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun loadSchoolSettings() {
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.api.getSchoolSettings()
                if (response.isSuccessful && response.body() != null) {
                    updateFields(response.body()!!)
                } else {
                    Toast.makeText(requireContext(), "Failed to load school settings", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun updateFields(settings: SchoolSettings) {
        nameInput.setText(settings.name.orEmpty())
        mottoInput.setText(settings.motto.orEmpty())
        addressInput.setText(settings.address.orEmpty())
        phoneInput.setText(settings.phone.orEmpty())
        emailInput.setText(settings.email.orEmpty())
        websiteInput.setText(settings.website.orEmpty())
        principalInput.setText(settings.principalName.orEmpty())
        sessionInput.setText(settings.currentSession.orEmpty())
        termInput.setText(settings.currentTerm.orEmpty())
    }

    private fun saveSchoolSettings() {
        val settings = SchoolSettings(
            currentSession = sessionInput.text.toString().trim().takeIf { it.isNotEmpty() },
            currentTerm = termInput.text.toString().trim().takeIf { it.isNotEmpty() },
            name = nameInput.text.toString().trim().takeIf { it.isNotEmpty() },
            motto = mottoInput.text.toString().trim().takeIf { it.isNotEmpty() },
            address = addressInput.text.toString().trim().takeIf { it.isNotEmpty() },
            phone = phoneInput.text.toString().trim().takeIf { it.isNotEmpty() },
            email = emailInput.text.toString().trim().takeIf { it.isNotEmpty() },
            website = websiteInput.text.toString().trim().takeIf { it.isNotEmpty() },
            principalName = principalInput.text.toString().trim().takeIf { it.isNotEmpty() }
        )

        lifecycleScope.launch {
            try {
                val response = RetrofitClient.api.saveSchoolSettings(settings)
                if (response.isSuccessful) {
                    Toast.makeText(requireContext(), "School settings saved", Toast.LENGTH_SHORT).show()
                } else {
                    Toast.makeText(requireContext(), "Failed to save settings", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun saveTermMeta() {
        val session = sessionInput.text.toString().trim()
        val term = termInput.text.toString().trim()
        val resumptionDate = resumptionDateInput.text.toString().trim()

        if (session.isBlank() || term.isBlank() || resumptionDate.isBlank()) {
            Toast.makeText(requireContext(), "Session, term and resumption date are required", Toast.LENGTH_SHORT).show()
            return
        }

        lifecycleScope.launch {
            try {
                val request = TermMetaRequest(
                    session = session,
                    term = term,
                    resumptionDate = resumptionDate
                )
                val response = RetrofitClient.api.setTermMeta(request)
                if (response.isSuccessful) {
                    Toast.makeText(requireContext(), "Term metadata updated", Toast.LENGTH_SHORT).show()
                } else {
                    Toast.makeText(requireContext(), "Failed to update term metadata", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }
}
