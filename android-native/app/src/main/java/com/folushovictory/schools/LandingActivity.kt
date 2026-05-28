package com.folushovictory.schools

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.folushovictory.schools.api.RetrofitClient
import com.folushovictory.schools.databinding.ActivityLandingBinding

/**
 * LandingActivity: Portal selection screen
 * 
 * Users can select their role (Admin, Teacher, Parent) before logging in.
 * If already authenticated, redirects to appropriate dashboard.
 */
class LandingActivity : AppCompatActivity() {
    private lateinit var binding: ActivityLandingBinding
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLandingBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        // Check if already logged in
        checkAuthenticationStatus()
        setupClickListeners()
        animateEntrance()
    }
    
    private fun checkAuthenticationStatus() {
        val token = RetrofitClient.getSavedToken()
        if (token != null && token.isNotEmpty()) {
            // User is logged in, redirect to appropriate portal
            val portal = RetrofitClient.getSavedPortal()
            redirectToDashboard(portal)
        } else {
            // Show landing screen
            binding.landingContainer.visibility = View.VISIBLE
            binding.loadingIndicator.visibility = View.GONE
        }
    }
    
    private fun setupClickListeners() {
        binding.btnAdminPortal.setOnClickListener {
            navigateToLogin("ADMIN", "🛡️", "Administrator Portal")
        }
        
        binding.btnTeacherPortal.setOnClickListener {
            navigateToLogin("TEACHER", "📚", "Teacher Portal")
        }
        
        binding.btnParentPortal.setOnClickListener {
            navigateToLogin("PARENT", "👪", "Parent Portal")
        }
    }
    
    private fun navigateToLogin(portal: String, emoji: String, title: String) {
        val intent = Intent(this, LoginActivity::class.java).apply {
            putExtra(LoginActivity.EXTRA_PORTAL, portal)
            putExtra(LoginActivity.EXTRA_EMOJI, emoji)
            putExtra(LoginActivity.EXTRA_TITLE, title)
        }
        startActivity(intent)
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
    }
    
    private fun redirectToDashboard(portal: String?) {
        if (portal.isNullOrEmpty()) return
        
        binding.loadingIndicator.visibility = View.VISIBLE
        binding.landingContainer.visibility = View.GONE
        
        val intent = Intent(this, MainActivity::class.java).apply {
            putExtra(MainActivity.EXTRA_PORTAL, portal)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        startActivity(intent)
        finish()
    }
    
    private fun animateEntrance() {
        // Fade in welcome content
        binding.welcomeSection.apply {
            alpha = 0f
            animate()
                .alpha(1f)
                .setDuration(600)
                .start()
        }
        
        // Stagger portal buttons
        val portals = listOf(
            binding.btnAdminPortal,
            binding.btnTeacherPortal,
            binding.btnParentPortal
        )
        
        portals.forEachIndexed { index, view ->
            view.apply {
                alpha = 0f
                translationY = 50f
                animate()
                    .alpha(1f)
                    .translationY(0f)
                    .setDuration(500)
                    .setStartDelay((100 * (index + 1)).toLong())
                    .start()
            }
        }
    }
    
    companion object {
        const val EXTRA_PORTAL = "extra_portal"
    }
}
