package com.folushovictory.schools

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import com.folushovictory.schools.api.RetrofitClient
import com.folushovictory.schools.databinding.ActivityLoginBinding
import com.folushovictory.schools.viewmodel.LoginViewModel
import com.folushovictory.schools.viewmodel.Portal

class LoginActivity : AppCompatActivity() {
    private lateinit var binding: ActivityLoginBinding
    private val viewModel: LoginViewModel by viewModels()
    private var selectedPortal = Portal.ADMIN
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        // Get portal from intent (from LandingActivity)
        getPortalFromIntent()
        
        setupObservers()
        setupClickListeners()
        updatePortalUI(selectedPortal)
    }
    
    private fun setupObservers() {
        viewModel.selectedPortal.observe(this) { portal ->
            selectedPortal = portal
            updatePortalUI(portal)
        }
        
        viewModel.isLoading.observe(this) { isLoading ->
            binding.btnLogin.isEnabled = !isLoading
            binding.btnLogin.text = if (isLoading) "Authenticating..." else "Authorize Access"
        }
        
        viewModel.user.observe(this) { user ->
            user?.token?.let { token ->
                RetrofitClient.saveToken(token)
                RetrofitClient.savePortal(selectedPortal.name)
                Toast.makeText(this, "Login successful!", Toast.LENGTH_SHORT).show()
                val intent = Intent(this, MainActivity::class.java)
                    .putExtra(MainActivity.EXTRA_PORTAL, selectedPortal.name)
                startActivity(intent)
                finish()
            }
        }
        
        viewModel.errorMessage.observe(this) { message ->
            if (message.isNotBlank()) {
                binding.tvError.text = message
                binding.tvError.visibility = View.VISIBLE
                Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
            } else {
                binding.tvError.visibility = View.GONE
            }
        }
    }
    
    private fun getPortalFromIntent() {
        val portalString = intent?.getStringExtra(EXTRA_PORTAL)
        selectedPortal = when (portalString) {
            "TEACHER" -> Portal.TEACHER
            "PARENT" -> Portal.PARENT
            else -> Portal.ADMIN
        }
        viewModel.selectPortal(selectedPortal)
    }
    
    private fun setupClickListeners() {
        binding.btnLogin.setOnClickListener {
            val username = binding.etUsername.text.toString().trim()
            val password = binding.etPassword.text.toString().trim()
            viewModel.login(username, password)
        }

        binding.tvForgotPassword.setOnClickListener {
            val portalName = viewModel.selectedPortal.value?.name ?: Portal.ADMIN.name
            val intent = Intent(this, ForgotPasswordActivity::class.java)
                .putExtra(ForgotPasswordActivity.EXTRA_PORTAL, portalName)
            startActivity(intent)
        }
        
        binding.btnPortalAdmin.setOnClickListener {
            viewModel.selectPortal(Portal.ADMIN)
        }
        
        binding.btnPortalTeacher.setOnClickListener {
            viewModel.selectPortal(Portal.TEACHER)
        }
        
        binding.btnPortalParent.setOnClickListener {
            viewModel.selectPortal(Portal.PARENT)
        }
    }
    
    private fun updatePortalUI(portal: Portal) {
        val portalButtons = listOf(
            binding.btnPortalAdmin to Portal.ADMIN,
            binding.btnPortalTeacher to Portal.TEACHER,
            binding.btnPortalParent to Portal.PARENT
        )
        
        portalButtons.forEach { (button, btnPortal) ->
            if (btnPortal == portal) {
                button.setBackgroundColor(resources.getColor(android.R.color.transparent))
                button.strokeColor = null
                button.setTextColor(resources.getColor(android.R.color.white))
                when (portal) {
                    Portal.ADMIN -> {
                        button.setBackgroundColor(0xFFD4AF37.toInt())
                    }
                    Portal.TEACHER -> {
                        button.setBackgroundColor(0xFF581C87.toInt())
                    }
                    Portal.PARENT -> {
                        button.setBackgroundColor(0xFFD4AF37.toInt())
                    }
                }
            } else {
                button.setBackgroundColor(resources.getColor(android.R.color.transparent))
                button.strokeColor = android.content.res.ColorStateList.valueOf(0xFF475569.toInt())
                button.setTextColor(0xFF94A3B8.toInt())
            }
        }
        
        when (portal) {
            Portal.ADMIN -> {
                binding.tvPortalTitle.text = "Administrator 🛡️"
                binding.etUsername.hint = "Employee ID"
                binding.etPassword.hint = "Admin Passphrase"
            }
            Portal.TEACHER -> {
                binding.tvPortalTitle.text = "Academic Staff 📚"
                binding.etUsername.hint = "Staff Code"
                binding.etPassword.hint = "Staff Secret"
            }
            Portal.PARENT -> {
                binding.tvPortalTitle.text = "Parent/Guardian 👪"
                binding.etUsername.hint = "Parent ID"
                binding.etPassword.hint = "Parent Access Code"
            }
        }
    }
    
    companion object {
        const val EXTRA_PORTAL = "extra_portal"
        const val EXTRA_EMOJI = "extra_emoji"
        const val EXTRA_TITLE = "extra_title"
    }
}
