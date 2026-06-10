<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Lock,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-vue-next'
import api from '../services/api'
import { useAuthStore } from '../stores/authStore'
import SchoolSettingsPanel from '../components/admin/SchoolSettingsPanel.vue'
import TeacherSettingsPanel from '../components/teacher/TeacherSettingsPanel.vue'

const authStore = useAuthStore()
const isAdmin = authStore.userRole === 'ADMIN'
const isTeacher = authStore.userRole === 'TEACHER'

const savingPassword = ref(false)
const passwordSuccess = ref(false)
const passwordError = ref('')
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
    }, 3000)
  } catch (err: any) {
    passwordError.value = err.response?.data?.error || 'Failed to update password. Ensure current password is correct.'
  } finally {
    savingPassword.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-8 fade-in relative">
    <span class="floating-math" aria-hidden="true">π</span>
    <div v-if="isAdmin" class="space-y-6">
      <SchoolSettingsPanel />
    </div>
    <div v-else-if="isTeacher" class="space-y-6">
      <TeacherSettingsPanel />
    </div>

    <section class="parchment-card p-6 lg:p-8">
      <div class="flex items-center gap-4 mb-8">
        <div class="h-12 w-12 rounded-xl bg-[#1B2A4A]/80 border border-[#C9A84C]/20 flex items-center justify-center">
          <Lock class="w-5 h-5 text-[#C9A84C]" />
        </div>
        <div>
          <h3 class="academic-heading text-lg text-[#FAFAF7]">Account Security</h3>
          <p class="text-sm text-[#F5F0E8]/50">Update your access credentials</p>
        </div>
      </div>

      <div v-if="passwordSuccess" class="mb-6 flex items-center gap-4 rounded-xl border border-[#7A9E7E]/25 bg-[#7A9E7E]/10 p-4 fade-in">
        <CheckCircle2 class="w-5 h-5 text-[#7A9E7E]" />
        <span class="text-xs font-black uppercase tracking-widest text-[#A8C4AB]">Password updated successfully!</span>
      </div>

      <div v-if="passwordError" class="mb-6 flex items-center gap-4 rounded-xl border border-[#8B3A52]/25 bg-[#8B3A52]/10 p-4 fade-in">
        <AlertCircle class="w-5 h-5 text-[#B45A74] flex-shrink-0" />
        <span class="text-xs font-black uppercase tracking-widest text-[#B45A74]">{{ passwordError }}</span>
      </div>

      <form @submit.prevent="handleChangePassword" class="space-y-8">
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div class="space-y-2">
            <label class="ml-1 text-[10px] font-black uppercase tracking-widest text-[#C9A84C]/60">Current Password</label>
            <input v-model="passwordForm.oldPassword" type="password" required class="academic-input" />
          </div>
          <div class="space-y-2">
            <label class="ml-1 text-[10px] font-black uppercase tracking-widest text-[#C9A84C]/60">New Password</label>
            <input v-model="passwordForm.newPassword" type="password" required class="academic-input" />
          </div>
        </div>

        <div class="grid grid-cols-1 items-end gap-6 md:grid-cols-2">
          <div class="space-y-2">
            <label class="ml-1 text-[10px] font-black uppercase tracking-widest text-[#C9A84C]/60">Confirm New Password</label>
            <input v-model="passwordForm.confirmPassword" type="password" required class="academic-input" />
          </div>
          <button
            type="submit"
            :disabled="savingPassword"
            class="chalkboard-btn chalkboard-btn-gold"
          >
            <component :is="savingPassword ? Loader2 : Lock" :class="{ 'animate-spin': savingPassword }" class="w-4 h-4" />
            {{ savingPassword ? 'Updating...' : 'Update Password' }}
          </button>
        </div>
      </form>
    </section>
  </div>
</template>
