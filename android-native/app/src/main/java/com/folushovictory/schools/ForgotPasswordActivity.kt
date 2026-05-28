package com.folushovictory.schools

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.folushovictory.schools.api.RetrofitClient
import com.folushovictory.schools.databinding.ActivityForgotPasswordBinding
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch

/**
 * ForgotPasswordActivity: Password recovery flow
 * 
 * Users can recover their passwords by:
 * 1. Entering their email/username
 * 2. Requesting recovery code
 * 3. Entering recovery code + new password
 * 4. Setting new password
 */
class ForgotPasswordActivity : AppCompatActivity() {
    companion object {
        const val EXTRA_PORTAL = "extra_portal"
        const val STEP_EMAIL = 1
        const val STEP_CODE = 2
        const val STEP_PASSWORD = 3
    }

    private lateinit var binding: ActivityForgotPasswordBinding
    private var portal = "admin"
    private var recoveryStep = STEP_EMAIL // 1: Email, 2: Code, 3: Password

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityForgotPasswordBinding.inflate(layoutInflater)
        setContentView(binding.root)

        portal = intent?.getStringExtra(EXTRA_PORTAL)?.lowercase() ?: "admin"
        
        setupUI()
        setupClickListeners()
    }
    
    private fun setupUI() {
        updateHelpText(portal)
        showEmailStep()
    }
    
    private fun setupClickListeners() {
        binding.btnReturnToLogin.setOnClickListener {
            finish()
        }
        
        binding.btnSendCode.setOnClickListener {
            requestRecoveryCode()
        }
        
        binding.btnVerifyCode.setOnClickListener {
            verifyRecoveryCode()
        }
        
        binding.btnResetPassword.setOnClickListener {
            resetPassword()
        }
    }
    
    private fun updateHelpText(portal: String) {
        when (portal) {
            "teacher" -> {
                binding.tvForgotTitle.text = "Teacher Recovery"
                binding.tvForgotEmoji.text = "📚"
                binding.tvForgotDescription.text = "Need a new staff passphrase? Follow the recovery steps below."
                binding.btnReturnToLogin.text = "Return to Teacher Login"
            }
            "parent" -> {
                binding.tvForgotTitle.text = "Parent / Guardian Recovery"
                binding.tvForgotEmoji.text = "👪"
                binding.tvForgotDescription.text = "Forgot your access code? Recover it securely below."
                binding.btnReturnToLogin.text = "Return to Parent Login"
            }
            else -> {
                binding.tvForgotTitle.text = "Administrator Recovery"
                binding.tvForgotEmoji.text = "🛡️"
                binding.tvForgotDescription.text = "Recover your admin credential securely."
                binding.btnReturnToLogin.text = "Return to Admin Login"
            }
        }
    }
    
    private fun showEmailStep() {
        recoveryStep = STEP_EMAIL
        binding.emailContainer.visibility = View.VISIBLE
        binding.codeContainer.visibility = View.GONE
        binding.passwordContainer.visibility = View.GONE
        binding.progressIndicator.progress = 33
        binding.progressLabel.text = "Step 1 of 3"
    }
    
    private fun showCodeStep() {
        recoveryStep = STEP_CODE
        binding.emailContainer.visibility = View.GONE
        binding.codeContainer.visibility = View.VISIBLE
        binding.passwordContainer.visibility = View.GONE
        binding.progressIndicator.progress = 66
        binding.progressLabel.text = "Step 2 of 3"
    }
    
    private fun showPasswordStep() {
        recoveryStep = STEP_PASSWORD
        binding.emailContainer.visibility = View.GONE
        binding.codeContainer.visibility = View.GONE
        binding.passwordContainer.visibility = View.VISIBLE
        binding.progressIndicator.progress = 100
        binding.progressLabel.text = "Step 3 of 3"
    }
    
    private fun requestRecoveryCode() {
        val email = binding.etEmail.text.toString().trim()
        
        if (email.isEmpty()) {
            Toast.makeText(this, "Please enter your email address", Toast.LENGTH_SHORT).show()
            return
        }
        
        binding.btnSendCode.isEnabled = false
        binding.btnSendCode.text = "Sending..."
        
        GlobalScope.launch(Dispatchers.Main) {
            try {
                // Call backend API to send recovery code
                val response = RetrofitClient.api.requestPasswordReset(
                    com.folushovictory.schools.models.PasswordResetRequest(
                        email = email,
                        portal = portal
                    )
                )
                
                if (response.isSuccessful && response.body()?.success == true) {
                    Toast.makeText(this@ForgotPasswordActivity, 
                        "Recovery code sent to your email", Toast.LENGTH_SHORT).show()
                    showCodeStep()
                } else {
                    Toast.makeText(this@ForgotPasswordActivity, 
                        response.body()?.message ?: "Failed to send recovery code", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@ForgotPasswordActivity, 
                    "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                binding.btnSendCode.isEnabled = true
                binding.btnSendCode.text = "Send Recovery Code"
            }
        }
    }
    
    private fun verifyRecoveryCode() {
        val email = binding.etEmail.text.toString().trim()
        val code = binding.etRecoveryCode.text.toString().trim()
        
        if (code.isEmpty() || code.length < 6) {
            Toast.makeText(this, "Please enter a valid recovery code", Toast.LENGTH_SHORT).show()
            return
        }
        
        binding.btnVerifyCode.isEnabled = false
        binding.btnVerifyCode.text = "Verifying..."
        
        GlobalScope.launch(Dispatchers.Main) {
            try {
                // Call backend API to verify recovery code
                val response = RetrofitClient.api.verifyRecoveryCode(
                    com.folushovictory.schools.models.VerifyRecoveryCodeRequest(
                        email = email,
                        recoveryCode = code
                    )
                )
                
                if (response.isSuccessful && response.body()?.success == true) {
                    Toast.makeText(this@ForgotPasswordActivity, 
                        "Code verified successfully", Toast.LENGTH_SHORT).show()
                    showPasswordStep()
                } else {
                    Toast.makeText(this@ForgotPasswordActivity, 
                        response.body()?.message ?: "Invalid recovery code", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@ForgotPasswordActivity, 
                    "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                binding.btnVerifyCode.isEnabled = true
                binding.btnVerifyCode.text = "Verify Code"
            }
        }
    }
    
    private fun resetPassword() {
        val email = binding.etEmail.text.toString().trim()
        val code = binding.etRecoveryCode.text.toString().trim()
        val newPassword = binding.etNewPassword.text.toString()
        val confirmPassword = binding.etConfirmPassword.text.toString()
        
        if (newPassword.isEmpty() || newPassword.length < 6) {
            Toast.makeText(this, "Password must be at least 6 characters", Toast.LENGTH_SHORT).show()
            return
        }
        
        if (newPassword != confirmPassword) {
            Toast.makeText(this, "Passwords do not match", Toast.LENGTH_SHORT).show()
            return
        }
        
        binding.btnResetPassword.isEnabled = false
        binding.btnResetPassword.text = "Resetting..."
        
        GlobalScope.launch(Dispatchers.Main) {
            try {
                // Call backend API to reset password
                val response = RetrofitClient.api.resetPassword(
                    com.folushovictory.schools.models.ResetPasswordRequest(
                        email = email,
                        recoveryCode = code,
                        newPassword = newPassword,
                        portal = portal
                    )
                )
                
                if (response.isSuccessful && response.body()?.success == true) {
                    Toast.makeText(this@ForgotPasswordActivity, 
                        "Password reset successfully! Please log in with your new password.", 
                        Toast.LENGTH_SHORT).show()
                    finish()
                } else {
                    Toast.makeText(this@ForgotPasswordActivity, 
                        response.body()?.message ?: "Failed to reset password", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@ForgotPasswordActivity, 
                    "Error: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                binding.btnResetPassword.isEnabled = true
                binding.btnResetPassword.text = "Reset Password"
            }
        }
    }
}
