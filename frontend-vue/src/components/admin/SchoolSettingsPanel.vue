<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { 
  Save, 
  Upload, 
  X, 
  Check, 
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  School,
  User,
  FileSignature
} from 'lucide-vue-next'
import api from '../../services/api'

const settings = ref<any>(null)
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const successMessage = ref('')

const schoolName = ref('')
const motto = ref('')
const address = ref('')
const phone = ref('')
const email = ref('')
const website = ref('')
const principalName = ref('')
const currentSession = ref('')
const currentTerm = ref('Third')

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
    schoolName.value = resp.data.name || ''
    motto.value = resp.data.motto || ''
    address.value = resp.data.address || ''
    phone.value = resp.data.phone || ''
    email.value = resp.data.email || ''
    website.value = resp.data.website || ''
    principalName.value = resp.data.principalName || ''
    currentSession.value = resp.data.currentSession || ''
    currentTerm.value = resp.data.currentTerm || 'Third'
    logoPreview.value = resp.data.logoUrl || ''
    signaturePreview.value = resp.data.principalSignatureUrl || ''
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
      principalName: principalName.value,
      currentSession: currentSession.value,
      currentTerm: currentTerm.value
    }

    if (logoFile.value) {
      payload.logoUrl = logoPreview.value
    } else if (settings.value?.logoUrl) {
      payload.logoUrl = settings.value.logoUrl
    }

    if (signaturePreview.value) {
      payload.principalSignatureUrl = signaturePreview.value
    } else if (settings.value?.principalSignatureUrl) {
      payload.principalSignatureUrl = settings.value.principalSignatureUrl
    }

    const resp = await api.post(SETTINGS_ENDPOINT, payload)

    successMessage.value = 'School settings saved successfully!'
    settings.value = resp.data
    logoFile.value = null
    signatureFile.value = null

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
  <div class="space-y-6 fade-in">
    <section class="parchment-card p-6 lg:p-8">
      <div class="flex items-center gap-4">
        <div class="h-14 w-14 rounded-2xl bg-[#1B2A4A]/80 border border-[#C9A84C]/20 flex items-center justify-center">
          <School class="w-7 h-7 text-[#C9A84C]" />
        </div>
        <div>
          <h2 class="academic-heading text-2xl text-[#FAFAF7]">School Settings</h2>
          <p class="text-sm text-[#F5F0E8]/50 mt-0.5">Manage school information and official documents</p>
        </div>
      </div>
    </section>

    <div v-if="loading" class="flex items-center justify-center py-20">
      <Loader2 class="w-12 h-12 text-[#C9A84C]/50 animate-spin" />
    </div>

    <div v-else class="space-y-6">
      <!-- Success Message -->
      <div v-if="successMessage" class="flex items-start gap-4 p-4 rounded-xl bg-[#7A9E7E]/10 border border-[#7A9E7E]/25">
        <Check class="w-5 h-5 text-[#7A9E7E] flex-shrink-0 mt-0.5" />
        <p class="text-sm font-bold text-[#A8C4AB]">{{ successMessage }}</p>
      </div>

      <div v-if="error" class="flex items-start gap-4 p-4 rounded-xl bg-[#8B3A52]/10 border border-[#8B3A52]/25">
        <AlertCircle class="w-5 h-5 text-[#B45A74] flex-shrink-0 mt-0.5" />
        <p class="text-sm font-bold text-[#B45A74]">{{ error }}</p>
      </div>

      <form @submit.prevent="saveSettings" class="space-y-8">
        <div class="parchment-card p-6 lg:p-8 space-y-6">
          <div class="flex items-center gap-3 pb-4 border-b border-[#C9A84C]/10">
            <div class="h-8 w-1 rounded-full bg-[#C9A84C]"></div>
            <h3 class="academic-heading text-lg text-[#FAFAF7]">Basic Information</h3>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-xs font-bold text-[#C9A84C]/80 mb-2 uppercase tracking-wider">
                School Name <span class="text-[#B45A74]">*</span>
              </label>
              <input
                v-model="schoolName"
                type="text"
                class="academic-input"
                placeholder="Enter school name"
                required
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-[#C9A84C]/80 mb-2 uppercase tracking-wider">
                School Motto
              </label>
              <input
                v-model="motto"
                type="text"
                class="academic-input"
                placeholder="Enter school motto"
              />
            </div>

            <div class="md:col-span-2">
              <label class="block text-xs font-bold text-[#C9A84C]/80 mb-2 uppercase tracking-wider">
                School Address
              </label>
              <textarea
                v-model="address"
                class="academic-input resize-none"
                rows="2"
                placeholder="Enter full school address"
              ></textarea>
            </div>

            <div>
              <label class="block text-xs font-bold text-[#C9A84C]/80 mb-2 uppercase tracking-wider">
                Phone Number
              </label>
              <input
                v-model="phone"
                type="tel"
                class="academic-input"
                placeholder="+234 (0) XXX XXX XXXX"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-[#C9A84C]/80 mb-2 uppercase tracking-wider">
                Email Address
              </label>
              <input
                v-model="email"
                type="email"
                class="academic-input"
                placeholder="info@school.com"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-[#C9A84C]/80 mb-2 uppercase tracking-wider">
                Website
              </label>
              <input
                v-model="website"
                type="url"
                class="academic-input"
                placeholder="https://www.school.com"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-[#C9A84C]/80 mb-2 uppercase tracking-wider">
                Current Session <span class="text-[#B45A74]">*</span>
              </label>
              <select v-model="currentSession" class="academic-select" required>
                <option>2023/2024</option>
                <option>2024/2025</option>
                <option>2025/2026</option>
                <option>2026/2027</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-[#C9A84C]/80 mb-2 uppercase tracking-wider">
                Current Term <span class="text-[#B45A74]">*</span>
              </label>
              <select v-model="currentTerm" class="academic-select" required>
                <option value="First">First Term</option>
                <option value="Second">Second Term</option>
                <option value="Third">Third Term</option>
              </select>
            </div>
          </div>
        </div>

        <div class="parchment-card p-6 lg:p-8 space-y-6">
          <div class="flex items-center gap-3 pb-4 border-b border-[#C9A84C]/10">
            <div class="h-8 w-1 rounded-full bg-[#C9A84C]"></div>
            <h3 class="academic-heading text-lg text-[#FAFAF7]">Principal Information</h3>
          </div>

          <div>
            <label class="block text-xs font-bold text-[#C9A84C]/80 mb-2 uppercase tracking-wider">
              <User class="w-3 h-3 inline mr-1" />
              Principal's Full Name
            </label>
            <input
              v-model="principalName"
              type="text"
              class="academic-input"
              placeholder="Enter principal's name"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-[#C9A84C]/80 mb-2 uppercase tracking-wider">
              <FileSignature class="w-3 h-3 inline mr-1" />
              Principal's Signature
            </label>
            <p class="text-xs text-[#F5F0E8]/40 mb-3">Upload a high-quality image of the principal's signature (PNG or JPG)</p>

            <div class="space-y-3">
              <div v-if="signaturePreview" class="relative rounded-xl p-4 bg-[#1B2A4A]/60 border border-[#C9A84C]/15">
                <img :src="signaturePreview" class="h-16 object-contain" alt="Principal Signature" />
                <button
                  v-if="signatureFile"
                  type="button"
                  @click="clearSignature"
                  class="absolute top-2 right-2 p-1 bg-[#8B3A52] hover:bg-[#B45A74] text-white rounded-lg transition-colors"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>

              <div
                @click="signatureFileInput?.click()"
                class="border-2 border-dashed border-[#C9A84C]/15 rounded-xl p-8 text-center cursor-pointer hover:border-[#C9A84C]/35 hover:bg-[#C9A84C]/3 transition-all"
              >
                <Upload class="w-8 h-8 text-[#C9A84C]/50 mx-auto mb-2" />
                <p class="text-sm font-bold text-[#F5F0E8]/70 mb-1">Click to upload signature</p>
                <p class="text-xs text-[#F5F0E8]/40">PNG or JPG • Max 2MB</p>
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

        <div class="parchment-card p-6 lg:p-8 space-y-6">
          <div class="flex items-center gap-3 pb-4 border-b border-[#C9A84C]/10">
            <div class="h-8 w-1 rounded-full bg-[#C9A84C]"></div>
            <h3 class="academic-heading text-lg text-[#FAFAF7]">School Logo</h3>
          </div>

          <div v-if="logoPreview" class="relative rounded-xl p-8 bg-[#1B2A4A]/60 border border-[#C9A84C]/15 text-center">
            <img :src="logoPreview" class="h-24 mx-auto object-contain" alt="School Logo" />
            <button
              v-if="logoFile"
              type="button"
              @click="clearLogo"
              class="absolute top-2 right-2 p-1 bg-[#8B3A52] hover:bg-[#B45A74] text-white rounded-lg transition-colors"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <div
            @click="logoFileInput?.click()"
            class="border-2 border-dashed border-[#C9A84C]/15 rounded-xl p-8 text-center cursor-pointer hover:border-[#C9A84C]/35 hover:bg-[#C9A84C]/3 transition-all"
          >
            <ImageIcon class="w-8 h-8 text-[#C9A84C]/50 mx-auto mb-2" />
            <p class="text-sm font-bold text-[#F5F0E8]/70 mb-1">Click to upload school logo</p>
            <p class="text-xs text-[#F5F0E8]/40">PNG or JPG • Max 2MB</p>
          </div>

          <input
            ref="logoFileInput"
            type="file"
            accept="image/png,image/jpeg"
            @change="handleLogoSelect"
            class="hidden"
          />
        </div>

        <div class="flex gap-3">
          <button
            type="submit"
            :disabled="saving"
            class="chalkboard-btn chalkboard-btn-gold"
          >
            <Save v-if="!saving" class="w-4 h-4" />
            <Loader2 v-else class="w-4 h-4 animate-spin" />
            {{ saving ? 'Saving...' : 'Save Settings' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
