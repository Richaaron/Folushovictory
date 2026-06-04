<template>
  <div class="teacher-registration-container login-root relative min-h-screen overflow-hidden">
    <div class="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-12 lg:px-8">
      <div class="registration-card glass-card glass-card-purple p-10 w-full max-w-xl">
      <!-- Header -->
      <div class="registration-header">
        <h1>Teacher Registration</h1>
        <p class="subtitle">Create your account to access the FVS Teacher Portal</p>
      </div>

      <!-- Success State -->
      <div v-if="registrationSuccess" class="success-state">
        <div class="success-icon">✓</div>
        <h2>Account Created Successfully!</h2>
        <p>Your teacher account has been set up and is ready to use.</p>
        
        <div class="credentials-box">
          <div class="credential-item">
            <label>Email</label>
            <p>{{ registrationData.email }}</p>
          </div>
        </div>
        <p class="success-note">
          You can now sign in using your email and password.
        </p>

        <div class="allocation-info" v-if="registrationData.subjectsAssigned || registrationData.formClassAssigned">
          <h3>Your Allocations</h3>
          <div class="allocation-items">
            <div class="allocation-item" v-if="registrationData.subjectsAssigned">
              <span class="icon">📚</span>
              <span>{{ registrationData.subjectsAssigned }} subject(s) assigned</span>
            </div>
            <div class="allocation-item" v-if="registrationData.formClassAssigned">
              <span class="icon">👥</span>
              <span>Form class assigned</span>
            </div>
          </div>
        </div>

        <p class="success-note">
          Check your email for a welcome message with login instructions and your assigned subjects.
        </p>

        <router-link to="/login/teacher" class="btn btn-primary">
          Go to Login
        </router-link>
      </div>

      <!-- Form State -->
      <form v-else @submit.prevent="submitRegistration" class="registration-form">
        <!-- Email Field -->
        <div class="form-group">
          <label for="email">Email Address</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            placeholder="your.email@school.com"
            :disabled="isSubmitting"
            @blur="validateField('email')"
            required
            class="modern-input"
          />
          <span v-if="fieldErrors.email" class="error-message">{{ fieldErrors.email }}</span>
        </div>

        <!-- Display Name Field -->
        <div class="form-group">
          <label for="displayName">Full Name</label>
          <input
            id="displayName"
            v-model="form.displayName"
            type="text"
            placeholder="John Smith"
            :disabled="isSubmitting"
            @blur="validateField('displayName')"
            required
            class="modern-input"
          />
          <span v-if="fieldErrors.displayName" class="error-message">{{ fieldErrors.displayName }}</span>
        </div>

        <!-- Password Field -->
        <div class="form-group">
          <label for="password">Password</label>
          <div class="password-input-wrapper">
            <input
              id="password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="At least 6 characters"
              :disabled="isSubmitting"
              @blur="validateField('password')"
              required
              class="modern-input"
            />
            <button
              type="button"
              class="toggle-password"
              @click="showPassword = !showPassword"
              :disabled="isSubmitting"
              title="Toggle password visibility"
            >
              {{ showPassword ? '👁️' : '👁️‍🗨️' }}
            </button>
          </div>
          <span v-if="fieldErrors.password" class="error-message">{{ fieldErrors.password }}</span>
          <div v-else class="password-hint">Minimum 6 characters</div>
        </div>

        <!-- Registration Code Field -->
        <div class="form-group">
          <label for="registrationCode">
            Registration Code
            <span class="required-note">(provided by admin)</span>
          </label>
          <input
            id="registrationCode"
            v-model="form.registrationCode"
            type="text"
            placeholder="tch-2026-001"
            :disabled="isSubmitting"
            @input="formatCodeInput"
            @blur="validateField('registrationCode')"
            maxlength="14"
            required
            class="modern-input"
          />
          <span v-if="fieldErrors.registrationCode" class="error-message">{{ fieldErrors.registrationCode }}</span>
          <div v-else class="code-hint">Format: tch-2026-NNN (e.g., tch-2026-001)</div>
        </div>

        <!-- Error Message -->
        <div v-if="formError" class="error-box">
          <div class="error-icon">⚠️</div>
          <div class="error-content">
            <h3>Registration Failed</h3>
            <p>{{ formError }}</p>
            <div v-if="errorDetails" class="error-details">
              <small>{{ errorDetails }}</small>
            </div>
          </div>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          class="neon-btn neon-btn-cyan w-full btn-submit"
          :disabled="isSubmitting || !isFormValid"
          :class="{ 'btn-loading': isSubmitting }"
        >
          {{ isSubmitting ? 'Creating Account...' : 'Create Account' }}
        </button>

        <!-- Login Link -->
        <div class="login-link">
          Already have an account? 
          <router-link to="/login/teacher">Sign in here</router-link>
        </div>
      </form>
    </div>

    <!-- Info Box -->
    <div class="info-box">
      <h3>📋 Need a Registration Code?</h3>
      <p>
        Registration codes are provided by your school administrator. 
        If you don't have one, please contact the school administration.
      </p>
    </div>
  </div>
</div>
</template>

<script>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/services/api';

export default {
  name: 'TeacherRegistrationForm',
  setup() {
    const router = useRouter();
    
    const form = ref({
      email: '',
      displayName: '',
      password: '',
      registrationCode: '',
    });

    const fieldErrors = ref({
      email: '',
      displayName: '',
      password: '',
      registrationCode: '',
    });

    const registrationSuccess = ref(false);
    const registrationData = ref({});
    const isSubmitting = ref(false);
    const formError = ref('');
    const errorDetails = ref('');
    const showPassword = ref(false);

    // Validation patterns
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const codePattern = /^TCH-2026-\d{3}$/i;

    // Normalize and validate code input (format: tch-2026-NNN)
    const formatCodeInput = () => {
      // Simply uppercase the input - user should enter code in format tch-2026-001
      form.value.registrationCode = form.value.registrationCode.toUpperCase();
    };

    // Validate individual fields
    const validateField = (fieldName) => {
      fieldErrors.value[fieldName] = '';

      switch (fieldName) {
        case 'email':
          if (!form.value.email) {
            fieldErrors.value.email = 'Email is required';
          } else if (!emailPattern.test(form.value.email)) {
            fieldErrors.value.email = 'Please enter a valid email address';
          }
          break;

        case 'displayName':
          if (!form.value.displayName) {
            fieldErrors.value.displayName = 'Full name is required';
          } else if (form.value.displayName.length < 2) {
            fieldErrors.value.displayName = 'Name must be at least 2 characters';
          }
          break;

        case 'password':
          if (!form.value.password) {
            fieldErrors.value.password = 'Password is required';
          } else if (form.value.password.length < 6) {
            fieldErrors.value.password = 'Password must be at least 6 characters';
          }
          break;

        case 'registrationCode':
          if (!form.value.registrationCode) {
            fieldErrors.value.registrationCode = 'Registration code is required';
          } else if (!codePattern.test(form.value.registrationCode)) {
            fieldErrors.value.registrationCode = 'Code must be in format tch-2026-NNN (e.g., tch-2026-001)';
          }
          break;
      }
    };

    // Check if all fields are valid
    const isFormValid = computed(() => {
      return (
        form.value.email &&
        form.value.displayName &&
        form.value.password &&
        form.value.registrationCode &&
        !fieldErrors.value.email &&
        !fieldErrors.value.displayName &&
        !fieldErrors.value.password &&
        !fieldErrors.value.registrationCode
      );
    });

    // Submit registration
    const submitRegistration = async () => {
      // Validate all fields first
      Object.keys(form.value).forEach(key => {
        if (key !== 'registrationCode') {
          validateField(key);
        }
      });
      validateField('registrationCode');

      if (!isFormValid.value) {
        return;
      }

      isSubmitting.value = true;
      formError.value = '';
      errorDetails.value = '';

      try {
        const response = await api.post('/api/auth/register/teacher', {
          email: form.value.email,
          password: form.value.password,
          displayName: form.value.displayName,
          registrationCode: form.value.registrationCode,
        });

        if (response.data.success) {
          registrationData.value = response.data.user;
          registrationSuccess.value = true;

          // Auto-redirect to login after 5 seconds
          setTimeout(() => {
            router.push('/login/teacher');
          }, 5000);
        }
      } catch (error) {
        isSubmitting.value = false;

        // Handle specific error codes
        if (error.response?.data?.code === 'INVALID_CODE') {
          formError.value = 'The registration code is invalid or expired.';
          errorDetails.value = 'Please check the code and try again, or contact your administrator.';
        } else if (error.response?.data?.code === 'EMAIL_EXISTS') {
          formError.value = 'This email is already registered.';
          errorDetails.value = 'Use a different email or try logging in if you already have an account.';
        } else if (error.response?.data?.code === 'EMAIL_MISMATCH') {
          formError.value = 'Email does not match the registration code.';
          errorDetails.value = 'The code was issued for a different email address.';
        } else if (error.response?.data?.code === 'CODE_NOT_FOUND') {
          formError.value = 'Registration code not found.';
          errorDetails.value = 'Please verify the code and try again.';
        } else {
          formError.value = error.response?.data?.message || 'Registration failed. Please try again.';
          errorDetails.value = error.response?.data?.details || '';
        }
      }
    };

    // Copy to clipboard
    const copyToClipboard = (text) => {
      navigator.clipboard.writeText(text);
      // Could add a toast notification here
    };

    return {
      form,
      fieldErrors,
      registrationSuccess,
      registrationData,
      isSubmitting,
      formError,
      errorDetails,
      showPassword,
      isFormValid,
      formatCodeInput,
      validateField,
      submitRegistration,
      copyToClipboard,
    };
  },
};
</script>

<style scoped>
.teacher-registration-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.registration-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 100%;
  padding: 40px;
  margin-bottom: 20px;
}

.registration-header {
  text-align: center;
  margin-bottom: 30px;
}

.registration-header h1 {
  margin: 0;
  color: #1e293b;
  font-size: 28px;
  font-weight: 600;
}

.subtitle {
  color: #64748b;
  margin: 8px 0 0;
  font-size: 14px;
}

/* Success State */
.success-state {
  text-align: center;
}

.success-icon {
  font-size: 48px;
  margin-bottom: 16px;
  display: block;
  animation: scaleIn 0.5s ease-out;
}

@keyframes scaleIn {
  from {
    transform: scale(0);
  }
  to {
    transform: scale(1);
  }
}

.success-state h2 {
  color: #0B6E4F;
  margin: 0 0 8px;
  font-size: 20px;
}

.success-state > p {
  color: #64748b;
  margin: 0 0 24px;
}

.credentials-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
  text-align: left;
}

.credential-item {
  margin-bottom: 16px;
}

.credential-item:last-child {
  margin-bottom: 0;
}

.credential-item label {
  display: block;
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 6px;
}

.credential-item p {
  margin: 0;
  color: #1e293b;
  font-size: 14px;
}

.username-display {
  background: white;
  border: 2px solid #667eea;
  border-radius: 6px;
  padding: 12px;
  font-family: monospace;
  font-weight: 600;
  color: #0B6E4F;
  font-size: 16px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.copy-btn {
  background: none;
  border: 1px solid #e2e8f0;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  color: #64748b;
  transition: all 0.2s;
}

.copy-btn:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.allocation-info {
  background: #eff6ff;
  border-left: 4px solid #3b82f6;
  padding: 16px;
  border-radius: 6px;
  margin: 20px 0;
  text-align: left;
}

.allocation-info h3 {
  margin: 0 0 12px;
  color: #1e40af;
  font-size: 14px;
  font-weight: 600;
}

.allocation-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.allocation-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1e40af;
  font-size: 14px;
}

.allocation-item .icon {
  font-size: 16px;
}

.success-note {
  color: #64748b;
  font-size: 13px;
  margin: 20px 0;
  line-height: 1.5;
}

/* Form Styles */
.registration-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  color: #1e293b;
  font-weight: 500;
  font-size: 14px;
}

.required-note {
  color: #64748b;
  font-weight: 400;
  font-size: 12px;
}

.form-group input {
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s;
  color: #1e293b;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group input:disabled {
  background: #f8fafc;
  color: #94a3b8;
  cursor: not-allowed;
}

.password-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.password-input-wrapper input {
  flex: 1;
  margin: 0;
}

.toggle-password {
  background: none;
  border: 1px solid #e2e8f0;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  color: #64748b;
}

.toggle-password:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.toggle-password:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  color: #dc2626;
  font-size: 12px;
  margin-top: -4px;
}

.password-hint,
.code-hint {
  color: #64748b;
  font-size: 12px;
  margin-top: -4px;
}

.error-box {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  padding: 16px;
  display: flex;
  gap: 12px;
}

.error-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.error-content h3 {
  margin: 0 0 4px;
  color: #991b1b;
  font-size: 14px;
}

.error-content p {
  margin: 0;
  color: #7f1d1d;
  font-size: 13px;
  line-height: 1.4;
}

.error-details {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #fecaca;
}

.error-details small {
  color: #7f1d1d;
}

/* Button Styles */
.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-block;
  text-align: center;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.btn-submit {
  width: 100%;
}

.btn-loading {
  opacity: 0.7;
}

.login-link {
  text-align: center;
  font-size: 14px;
  color: #64748b;
  margin-top: 12px;
}

.login-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.login-link a:hover {
  text-decoration: underline;
}

/* Info Box */
.info-box {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  padding: 20px;
  max-width: 500px;
  width: 100%;
  color: #1e293b;
}

.info-box h3 {
  margin: 0 0 8px;
  font-size: 16px;
  color: #1e293b;
}

.info-box p {
  margin: 0;
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
}

/* Responsive */
@media (max-width: 640px) {
  .teacher-registration-container {
    padding: 12px;
  }

  .registration-card {
    padding: 24px;
  }

  .registration-header h1 {
    font-size: 24px;
  }

  .info-box {
    width: 100%;
  }
}
</style>
