<script setup lang="ts">
import { ref } from 'vue'
import {
  Lock,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-vue-next'
import api from '../services/api'
import { useAuthStore } from '../stores/authStore'
import SchoolSettingsPanel from '../components/admin/SchoolSettingsPanel.vue'

const authStore = useAuthStore()
const isAdmin = authStore.userRole === 'ADMIN'

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
  <div class="mx-auto max-w-6xl space-y-8 fade-in">
    <div v-if="isAdmin" class="space-y-6">
      <SchoolSettingsPanel />
    </div>

    <section class="rounded-3xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
      <div class="mb-8 flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
          <Lock class="h-5 w-5" />
        </div>
        <div>
          <h3 class="text-lg font-black tracking-tight text-slate-900 dark:text-white">Account Security</h3>
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Update your access credentials</p>
        </div>
      </div>

      <div v-if="passwordSuccess" class="mb-8 flex items-center gap-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-600 fade-in dark:border-emerald-900/30 dark:bg-emerald-900/20">
        <CheckCircle2 class="h-6 w-6" />
        <span class="text-sm font-black uppercase tracking-widest">Password updated successfully!</span>
      </div>

      <div v-if="passwordError" class="mb-8 flex items-center gap-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-red-600 fade-in dark:border-red-900/30 dark:bg-red-900/20">
        <AlertCircle class="h-6 w-6 flex-shrink-0" />
        <span class="text-sm font-black uppercase tracking-widest">{{ passwordError }}</span>
      </div>

      <form @submit.prevent="handleChangePassword" class="space-y-8">
        <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div class="space-y-2">
            <label class="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Current Password</label>
            <input v-model="passwordForm.oldPassword" type="password" required class="w-full rounded-2xl border-none bg-slate-50 px-6 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500 dark:bg-slate-800" />
          </div>
          <div class="space-y-2">
            <label class="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">New Password</label>
            <input v-model="passwordForm.newPassword" type="password" required class="w-full rounded-2xl border-none bg-slate-50 px-6 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500 dark:bg-slate-800" />
          </div>
        </div>

        <div class="grid grid-cols-1 items-end gap-8 md:grid-cols-2">
          <div class="space-y-2">
            <label class="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Confirm New Password</label>
            <input v-model="passwordForm.confirmPassword" type="password" required class="w-full rounded-2xl border-none bg-slate-50 px-6 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500 dark:bg-slate-800" />
          </div>
          <button
            type="submit"
            :disabled="savingPassword"
            class="flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-8 py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg transition-all hover:bg-amber-600 disabled:bg-slate-400"
          >
            <component :is="savingPassword ? Loader2 : Lock" :class="{ 'animate-spin': savingPassword }" class="h-4 w-4" />
            {{ savingPassword ? 'Updating...' : 'Update Password' }}
          </button>
        </div>
      </form>
    </section>
  </div>
</template>
