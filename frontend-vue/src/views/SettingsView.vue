<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Lock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck
} from 'lucide-vue-next'
import api from '../services/api'
import { useAuthStore } from '../stores/authStore'
import SchoolSettingsPanel from '../components/admin/SchoolSettingsPanel.vue'
import TeacherSettingsPanel from '../components/teacher/TeacherSettingsPanel.vue'

const authStore = useAuthStore()
const isAdmin = computed(() => String(authStore.userRole || '').toUpperCase() === 'ADMIN')
const isTeacher = computed(() => ['TEACHER', 'FORM_TEACHER', 'FORM_MASTER'].includes(String(authStore.userRole || '').toUpperCase()))

const savingPassword = ref(false)
const passwordSuccess = ref(false)
const passwordError = ref('')

const showOld = ref(false)
const showNew = ref(false)
const showConfirm = ref(false)

const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const handleChangePassword = async () => {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordError.value = 'New passwords do not match'
    return
  }

  if (passwordForm.value.newPassword.length < 6) {
    passwordError.value = 'New password must be at least 6 characters'
    return
  }

  savingPassword.value = true
  passwordSuccess.value = false
  passwordError.value = ''

  try {
    await api.post('/api/change-password', {
      oldPassword: passwordForm.value.oldPassword,
      newPassword: passwordForm.value.newPassword
    })
    passwordSuccess.value = true
    passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
    setTimeout(() => {
      passwordSuccess.value = false
    }, 4000)
  } catch (err: any) {
    passwordError.value = err.response?.data?.error || 'Failed to update password. Ensure current password is correct.'
  } finally {
    savingPassword.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-8 pb-12">
    <!-- Admin or Teacher specific settings panel -->
    <div v-if="isAdmin" class="space-y-6">
      <SchoolSettingsPanel />
    </div>
    <div v-else-if="isTeacher" class="space-y-6">
      <TeacherSettingsPanel />
    </div>

    <!-- Account Security Card -->
    <section class="bg-white rounded-2xl border-2 border-[#BAE6FD] p-6 lg:p-8 shadow-sm space-y-6">
      <div class="flex items-center gap-4 pb-4 border-b border-sky-100">
        <div class="h-12 w-12 rounded-xl bg-sky-100 border border-sky-300 flex items-center justify-center text-sky-800">
          <ShieldCheck class="w-6 h-6 text-sky-800" />
        </div>
        <div>
          <h3 class="text-xl font-black text-[#0C4A6E]">Account Security & Password</h3>
          <p class="text-xs sm:text-sm font-semibold text-slate-600">Update your account credentials to keep your access secure</p>
        </div>
      </div>

      <!-- Success Notice -->
      <div v-if="passwordSuccess" class="flex items-center gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-900">
        <CheckCircle2 class="w-5 h-5 text-emerald-700 shrink-0" />
        <span class="text-sm font-black">Password successfully changed! Your new credentials are now active.</span>
      </div>

      <!-- Error Notice -->
      <div v-if="passwordError" class="flex items-center gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-red-900">
        <AlertCircle class="w-5 h-5 text-red-700 shrink-0" />
        <span class="text-sm font-black">{{ passwordError }}</span>
      </div>

      <form @submit.prevent="handleChangePassword" class="space-y-6">
        <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
          
          <!-- Current Password -->
          <div class="space-y-2">
            <label class="block text-xs font-black uppercase tracking-wider text-[#0C4A6E]">
              Current Password <span class="text-red-600">*</span>
            </label>
            <div class="relative">
              <input
                v-model="passwordForm.oldPassword"
                :type="showOld ? 'text' : 'password'"
                required
                placeholder="Enter your current password"
                class="w-full px-4 py-3 bg-white text-slate-900 placeholder-slate-400 border-2 border-slate-300 rounded-xl focus:border-sky-600 focus:ring-2 focus:ring-sky-200 outline-none text-base transition-all pr-12 font-medium"
              />
              <button
                type="button"
                @click="showOld = !showOld"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 p-1"
                aria-label="Toggle password visibility"
              >
                <Eye v-if="!showOld" class="w-5 h-5 text-slate-500" />
                <EyeOff v-else class="w-5 h-5 text-amber-600" />
              </button>
            </div>
          </div>

          <!-- New Password -->
          <div class="space-y-2">
            <label class="block text-xs font-black uppercase tracking-wider text-[#0C4A6E]">
              New Password <span class="text-red-600">*</span>
            </label>
            <div class="relative">
              <input
                v-model="passwordForm.newPassword"
                :type="showNew ? 'text' : 'password'"
                required
                placeholder="Minimum 6 characters"
                class="w-full px-4 py-3 bg-white text-slate-900 placeholder-slate-400 border-2 border-slate-300 rounded-xl focus:border-sky-600 focus:ring-2 focus:ring-sky-200 outline-none text-base transition-all pr-12 font-medium"
              />
              <button
                type="button"
                @click="showNew = !showNew"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 p-1"
                aria-label="Toggle password visibility"
              >
                <Eye v-if="!showNew" class="w-5 h-5 text-slate-500" />
                <EyeOff v-else class="w-5 h-5 text-amber-600" />
              </button>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 items-end gap-5 md:grid-cols-2">
          <!-- Confirm New Password -->
          <div class="space-y-2">
            <label class="block text-xs font-black uppercase tracking-wider text-[#0C4A6E]">
              Confirm New Password <span class="text-red-600">*</span>
            </label>
            <div class="relative">
              <input
                v-model="passwordForm.confirmPassword"
                :type="showConfirm ? 'text' : 'password'"
                required
                placeholder="Re-type new password"
                class="w-full px-4 py-3 bg-white text-slate-900 placeholder-slate-400 border-2 border-slate-300 rounded-xl focus:border-sky-600 focus:ring-2 focus:ring-sky-200 outline-none text-base transition-all pr-12 font-medium"
              />
              <button
                type="button"
                @click="showConfirm = !showConfirm"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 p-1"
                aria-label="Toggle password visibility"
              >
                <Eye v-if="!showConfirm" class="w-5 h-5 text-slate-500" />
                <EyeOff v-else class="w-5 h-5 text-amber-600" />
              </button>
            </div>
          </div>

          <!-- Submit Button -->
          <div>
            <button
              type="submit"
              :disabled="savingPassword"
              class="w-full h-[50px] px-6 rounded-xl bg-sky-700 hover:bg-sky-800 active:bg-sky-900 text-white font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
            >
              <component :is="savingPassword ? Loader2 : Lock" :class="{ 'animate-spin': savingPassword }" class="w-5 h-5 text-white" />
              <span>{{ savingPassword ? 'Updating Password...' : 'Save New Password' }}</span>
            </button>
          </div>
        </div>
      </form>
    </section>
  </div>
</template>
