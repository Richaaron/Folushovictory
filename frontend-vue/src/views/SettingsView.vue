<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { 
  Settings, 
  School, 
  ShieldCheck, 
  Save, 
  Upload, 
  Globe, 
  Mail, 
  Phone, 
  MapPin,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Lock
} from 'lucide-vue-next'
import api from '../services/api'
import { useAuthStore } from '../stores/authStore'

const authStore = useAuthStore()
const isAdmin = authStore.userRole === 'ADMIN'

const loading = ref(true)
const saving = ref(false)
const success = ref(false)
const error = ref('')
const settings = ref({
  name: 'Folusho Victory Schools',
  motto: 'Fountain of Knowledge',
  address: 'Barnawa Kaduna South, Kaduna State',
  email: 'info@folushovictory.edu',
  phone: '+234 800 000 0000',
  website: 'www.folushovictory.edu'
})

const savingPassword = ref(false)
const passwordSuccess = ref(false)
const passwordError = ref('')
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const fetchSettings = async () => {
  if (!isAdmin) {
    loading.value = false
    return
  }
  loading.value = true
  try {
    const { data } = await api.get('/api/config/school')
    if (data) {
      settings.value = { ...settings.value, ...data }
    }
  } catch (err) {
    console.error('Error fetching school settings:', err)
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  saving.value = true
  success.value = false
  error.value = ''
  try {
    await api.post('/api/config/school', settings.value)
    success.value = true
    setTimeout(() => success.value = false, 3000)
  } catch (err: any) {
    const status = err.response?.status
    const message = err.response?.data?.error || err.message
    
    if (status === 401) {
      error.value = 'Unauthorized: Please log in again'
    } else if (status === 403) {
      error.value = 'Forbidden: You do not have permission to update settings'
    } else if (status === 400) {
      error.value = `Invalid data: ${message}`
    } else {
      error.value = message || 'Failed to save settings'
    }
    
    console.error('Error saving settings:', err)
  } finally {
    saving.value = false
  }
}

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
    setTimeout(() => passwordSuccess.value = false, 3000)
  } catch (err: any) {
    passwordError.value = err.response?.data?.error || 'Failed to update password. Ensure current password is correct.'
  } finally {
    savingPassword.value = false
  }
}

onMounted(fetchSettings)
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-8 fade-in">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-black text-slate-900 dark:text-white tracking-tight">System <span class="text-royal-purple">Configuration</span></h1>
        <p class="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">{{ isAdmin ? 'Manage Institutional Identity and Global Settings' : 'Manage your personal security settings' }}</p>
      </div>
      <button 
        v-if="isAdmin"
        @click="handleSave"
        :disabled="saving"
        class="flex items-center gap-3 rounded-2xl purple-gradient px-8 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-purple-200 dark:shadow-purple-900/30 transition hover:scale-105 active:scale-95 disabled:opacity-50"
      >
        <component :is="saving ? Loader2 : Save" class="w-4 h-4" :class="{'animate-spin': saving}" /> 
        {{ saving ? 'Saving Changes...' : 'Save Configuration' }}
      </button>
    </div>

    <div v-if="loading" class="h-[400px] flex items-center justify-center">
      <Loader2 class="w-12 h-12 text-royal-purple animate-spin" />
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Left Column: Branding -->
      <div v-if="isAdmin" class="lg:col-span-1 space-y-8">
        <div class="academic-card rounded-[2.5rem] p-8 text-center">
          <h3 class="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Institutional Logo</h3>
          <div class="relative inline-block group">
            <div class="h-40 w-40 rounded-[2.5rem] bg-slate-50 dark:bg-slate-800 p-6 shadow-inner border border-slate-100 dark:border-slate-800 flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="Logo" class="object-contain w-full h-full" />
            </div>
            <button class="absolute -bottom-2 -right-2 h-12 w-12 rounded-2xl bg-royal-purple text-white shadow-xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95">
              <Upload class="w-5 h-5" />
            </button>
          </div>
          <p class="mt-6 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
            Upload high-resolution <br/>PNG or JPG (Max 2MB)
          </p>
        </div>

        <div class="gold-gradient rounded-[2.5rem] p-8 text-slate-900">
          <div class="flex items-center gap-3 mb-4">
            <ShieldCheck class="w-6 h-6 opacity-50" />
            <h4 class="text-xs font-black uppercase tracking-widest">Global Status</h4>
          </div>
          <div class="flex items-center justify-between p-4 rounded-2xl bg-white/30 backdrop-blur-md border border-white/20">
            <span class="text-xs font-bold uppercase tracking-widest">Portal Mode</span>
            <span class="px-3 py-1 bg-slate-900 text-white text-[8px] font-black rounded-lg uppercase tracking-widest">Live</span>
          </div>
        </div>
      </div>

      <!-- Right Column: Form -->
      <div :class="[isAdmin ? 'lg:col-span-2' : 'lg:col-span-3']" class="space-y-6">
        <div v-if="isAdmin" class="academic-card rounded-[2.5rem] p-8 sm:p-12">
          <div v-if="success" class="mb-8 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl flex items-center gap-4 text-emerald-600 fade-in">
            <CheckCircle2 class="w-6 h-6" />
            <span class="text-sm font-black uppercase tracking-widest">Settings synchronized successfully!</span>
          </div>

          <div v-if="error" class="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center gap-4 text-red-600 fade-in">
            <AlertCircle class="w-6 h-6 flex-shrink-0" />
            <span class="text-sm font-black uppercase tracking-widest">{{ error }}</span>
          </div>

          <div class="space-y-8">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                  <School class="w-3 h-3" /> School Official Name
                </label>
                <input v-model="settings.name" type="text" class="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-royal-purple outline-none" />
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                  <Settings class="w-3 h-3" /> Institutional Motto
                </label>
                <input v-model="settings.motto" type="text" class="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-royal-purple outline-none" />
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                <MapPin class="w-3 h-3" /> Campus Address
              </label>
              <textarea v-model="settings.address" rows="3" class="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-royal-purple outline-none resize-none"></textarea>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                  <Mail class="w-3 h-3" /> Official Email
                </label>
                <input v-model="settings.email" type="email" class="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-royal-purple outline-none" />
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                  <Phone class="w-3 h-3" /> Contact Phone
                </label>
                <input v-model="settings.phone" type="text" class="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-royal-purple outline-none" />
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                <Globe class="w-3 h-3" /> School Website
              </label>
              <input v-model="settings.website" type="text" class="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-royal-purple outline-none" placeholder="https://www.folushovictory.edu" />
            </div>
          </div>
        </div>

        <!-- Security Settings Section -->
        <div class="academic-card rounded-[2.5rem] p-8 sm:p-12">
          <div class="flex items-center gap-3 mb-8">
            <div class="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Lock class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-lg font-black text-slate-900 dark:text-white tracking-tight">Security Settings</h3>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Update your access credentials</p>
            </div>
          </div>

          <div v-if="passwordSuccess" class="mb-8 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl flex items-center gap-4 text-emerald-600 fade-in">
            <CheckCircle2 class="w-6 h-6" />
            <span class="text-sm font-black uppercase tracking-widest">Password updated successfully!</span>
          </div>

          <div v-if="passwordError" class="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center gap-4 text-red-600 fade-in">
            <AlertCircle class="w-6 h-6 flex-shrink-0" />
            <span class="text-sm font-black uppercase tracking-widest">{{ passwordError }}</span>
          </div>

          <form @submit.prevent="handleChangePassword" class="space-y-8">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Current Password</label>
                <input v-model="passwordForm.oldPassword" type="password" required class="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-none" />
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">New Password</label>
                <input v-model="passwordForm.newPassword" type="password" required class="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-none" />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Confirm New Password</label>
                <input v-model="passwordForm.confirmPassword" type="password" required class="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-none" />
              </div>
              <button 
                type="submit"
                :disabled="savingPassword"
                class="flex items-center justify-center gap-3 rounded-2xl bg-slate-900 dark:bg-slate-700 px-8 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl transition hover:bg-slate-800 active:scale-95 disabled:opacity-50 h-[52px]"
              >
                <component :is="savingPassword ? Loader2 : Lock" class="w-4 h-4" :class="{'animate-spin': savingPassword}" /> 
                Update Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
