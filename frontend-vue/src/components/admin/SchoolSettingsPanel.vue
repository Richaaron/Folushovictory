<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { 
  Save, 
  Upload, 
  X, 
  Check, 
  AlertCircle,
  Loader2,
  Image as ImageIcon
} from 'lucide-vue-next'
import api from '../../services/api'

const settings = ref<any>(null)
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const successMessage = ref('')

// Form fields
const schoolName = ref('')
const motto = ref('')
const address = ref('')
const phone = ref('')
const email = ref('')
const website = ref('')
const principalName = ref('')

// File uploads
const logoFile = ref<File | null>(null)
const logoPreview = ref('')
const signatureFile = ref<File | null>(null)
const signaturePreview = ref('')

const logoFileInput = ref<HTMLInputElement | null>(null)
const signatureFileInput = ref<HTMLInputElement | null>(null)
const SETTINGS_ENDPOINT = '/api/admin/school-settings'

const fetchSettings = async () => {
  loading.value = true
  try {
    const resp = await api.get(SETTINGS_ENDPOINT)
    settings.value = resp.data
    
    // Populate form fields
    schoolName.value = resp.data.name || ''
    motto.value = resp.data.motto || ''
    address.value = resp.data.address || ''
    phone.value = resp.data.phone || ''
    email.value = resp.data.email || ''
    website.value = resp.data.website || ''
    principalName.value = resp.data.principalName || ''
    
    if (resp.data.logoUrl) logoPreview.value = resp.data.logoUrl
    if (resp.data.principalSignatureUrl) signaturePreview.value = resp.data.principalSignatureUrl
  } catch (err: any) {
    error.value = 'Failed to load school settings'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const handleLogoSelect = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (input.files?.[0]) {
    logoFile.value = input.files[0]
    const reader = new FileReader()
    reader.onload = (e) => {
      logoPreview.value = e.target?.result as string
    }
    reader.readAsDataURL(logoFile.value)
  }
}

const handleSignatureSelect = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (input.files?.[0]) {
    signatureFile.value = input.files[0]
    const reader = new FileReader()
    reader.onload = (e) => {
      signaturePreview.value = e.target?.result as string
    }
    reader.readAsDataURL(signatureFile.value)
  }
}

const clearLogo = () => {
  logoFile.value = null
  logoPreview.value = ''
  if (logoFileInput.value) logoFileInput.value.value = ''
}

const clearSignature = () => {
  signatureFile.value = null
  signaturePreview.value = ''
  if (signatureFileInput.value) signatureFileInput.value.value = ''
}

const saveSettings = async () => {
  saving.value = true
  error.value = ''
  successMessage.value = ''

  try {
    const payload: any = {
      name: schoolName.value,
      motto: motto.value,
      address: address.value,
      phone: phone.value,
      email: email.value,
      website: website.value,
      principalName: principalName.value
    }

    // Add logo if provided (keep existing if not changed)
    if (logoFile.value) {
      payload.logoUrl = logoPreview.value  // This is the base64 data URL
    }

    // Add principal signature if provided (keep existing if not changed)
    if (signatureFile.value) {
      payload.principalSignatureUrl = signaturePreview.value  // This is the base64 data URL
    }

    const resp = await api.post(SETTINGS_ENDPOINT, payload)

    successMessage.value = 'School settings saved successfully!'
    settings.value = resp.data
    logoFile.value = null
    signatureFile.value = null
    
    // Reload to show updated values
    await fetchSettings()
    
    setTimeout(() => {
      successMessage.value = ''
    }, 5000)
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to save school settings'
    console.error(err)
  } finally {
    saving.value = false
  }
}

onMounted(fetchSettings)
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-3xl font-black text-slate-900 dark:text-white">School Settings</h2>
        <p class="text-slate-500 mt-1">Manage school information and official documents</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <Loader2 class="w-12 h-12 text-teal-600 animate-spin" />
    </div>

    <div v-else class="space-y-6">
      <!-- Success Message -->
      <div v-if="successMessage" class="flex items-start gap-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
        <Check class="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div>
          <p class="font-bold text-emerald-900 dark:text-emerald-200">{{ successMessage }}</p>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="flex items-start gap-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
        <AlertCircle class="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <p class="font-bold text-red-900 dark:text-red-200">{{ error }}</p>
        </div>
      </div>

      <!-- Main Form -->
      <form @submit.prevent="saveSettings" class="space-y-8">
        <!-- School Basic Info Section -->
        <div class="glass-card rounded-[2.5rem] p-8 border-royal-gold/15 bg-slate-950/95 space-y-6">
          <h3 class="text-xl font-bold text-white flex items-center gap-2">
            <span class="w-1 h-6 bg-teal-600 rounded-full"></span>
            Basic Information
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- School Name -->
            <div>
              <label class="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                School Name <span class="text-red-500">*</span>
              </label>
              <input
                v-model="schoolName"
                type="text"
                class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
                placeholder="Enter school name"
                required
              />
            </div>

            <!-- Motto -->
            <div>
              <label class="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                School Motto
              </label>
              <input
                v-model="motto"
                type="text"
                class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
                placeholder="Enter school motto"
              />
            </div>

            <!-- Address -->
            <div class="md:col-span-2">
              <label class="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                School Address
              </label>
              <textarea
                v-model="address"
                class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all resize-none"
                rows="2"
                placeholder="Enter full school address"
              ></textarea>
            </div>

            <!-- Phone -->
            <div>
              <label class="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                Phone Number
              </label>
              <input
                v-model="phone"
                type="tel"
                class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
                placeholder="+234 (0) XXX XXX XXXX"
              />
            </div>

            <!-- Email -->
            <div>
              <label class="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                Email Address
              </label>
              <input
                v-model="email"
                type="email"
                class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
                placeholder="info@school.com"
              />
            </div>

            <!-- Website -->
            <div>
              <label class="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                Website
              </label>
              <input
                v-model="website"
                type="url"
                class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
                placeholder="https://www.school.com"
              />
            </div>
          </div>
        </div>

        <!-- Principal Section -->
        <div class="glass-card rounded-[2.5rem] p-8 border-royal-gold/15 bg-slate-950/95 space-y-6">
          <h3 class="text-xl font-bold text-white flex items-center gap-2">
            <span class="w-1 h-6 bg-amber-500 rounded-full"></span>
            Principal Information
          </h3>

          <!-- Principal Name -->
          <div>
            <label class="block text-sm font-bold text-slate-900 dark:text-white mb-2">
              Principal's Full Name
            </label>
            <input
              v-model="principalName"
              type="text"
              class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
              placeholder="Enter principal's name"
            />
          </div>

          <!-- Principal Signature Upload -->
          <div>
            <label class="block text-sm font-bold text-slate-900 dark:text-white mb-2">
              Principal's Signature (for report cards)
            </label>
            <p class="text-xs text-slate-500 mb-3">Upload a high-quality image of the principal's signature (PNG or JPG)</p>
            
            <div class="space-y-3">
              <!-- Current Signature Preview -->
              <div v-if="signaturePreview" class="relative bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <img :src="signaturePreview" class="h-16 object-contain" alt="Principal Signature" />
                <button
                  v-if="signatureFile"
                  type="button"
                  @click="clearSignature"
                  class="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>

              <!-- Upload Button -->
              <div
                @click="signatureFileInput?.click()"
                class="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center cursor-pointer hover:border-teal-500 dark:hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/10 transition-all"
              >
                <Upload class="w-8 h-8 text-teal-600 mx-auto mb-2" />
                <p class="font-bold text-slate-900 dark:text-white mb-1">Click to upload signature</p>
                <p class="text-xs text-slate-500">PNG or JPG • Max 2MB</p>
              </div>

              <input
                ref="signatureFileInput"
                type="file"
                accept="image/png,image/jpeg"
                @change="handleSignatureSelect"
                class="hidden"
              />
            </div>
          </div>
        </div>

        <!-- School Logo Section -->
        <div class="glass-card rounded-[2.5rem] p-8 border-royal-gold/15 bg-slate-950/95 space-y-6">
          <h3 class="text-xl font-bold text-white flex items-center gap-2">
            <span class="w-1 h-6 bg-blue-600 rounded-full"></span>
            School Logo
          </h3>

          <!-- Logo Preview -->
          <div v-if="logoPreview" class="relative bg-slate-50 dark:bg-slate-800 rounded-xl p-8 border border-slate-200 dark:border-slate-700 text-center">
            <img :src="logoPreview" class="h-24 mx-auto object-contain" alt="School Logo" />
            <button
              v-if="logoFile"
              type="button"
              @click="clearLogo"
              class="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Upload Button -->
          <div
            @click="logoFileInput?.click()"
            class="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center cursor-pointer hover:border-teal-500 dark:hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/10 transition-all"
          >
            <ImageIcon class="w-8 h-8 text-teal-600 mx-auto mb-2" />
            <p class="font-bold text-slate-900 dark:text-white mb-1">Click to upload school logo</p>
            <p class="text-xs text-slate-500">PNG or JPG • Max 2MB</p>
          </div>

          <input
            ref="logoFileInput"
            type="file"
            accept="image/png,image/jpeg"
            @change="handleLogoSelect"
            class="hidden"
          />
        </div>

        <!-- Submit Button -->
        <div class="flex gap-3">
          <button
            type="submit"
            :disabled="saving"
            class="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-400 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-wider transition-colors shadow-lg"
          >
            <Save v-if="!saving" class="w-5 h-5" />
            <Loader2 v-else class="w-5 h-5 animate-spin" />
            {{ saving ? 'Saving...' : 'Save Settings' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
input:focus,
textarea:focus {
  outline: none;
}
</style>
