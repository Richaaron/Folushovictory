<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  Check,
  AlertCircle,
  Loader2,
  FileSignature
} from 'lucide-vue-next'
import api from '../../services/api'

const profile = ref<any>(null)
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const successMessage = ref('')

const displayName = ref('')
const signatureFile = ref<File | null>(null)
const signaturePreview = ref('')
const signatureFileInput = ref<HTMLInputElement | null>(null)

const PROFILE_ENDPOINT = '/api/teacher/profile'

const fetchProfile = async () => {
  loading.value = true
  error.value = ''
  try {
    const resp = await api.get(PROFILE_ENDPOINT)
    profile.value = resp.data
    displayName.value = resp.data.displayName || ''
    signaturePreview.value = resp.data.signatureUrl || ''
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Unable to load teacher profile.'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const handleSignatureSelect = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (input.files?.[0]) {
    signatureFile.value = input.files[0]
    const reader = new FileReader()
    reader.onload = (event) => {
      signaturePreview.value = event.target?.result as string
    }
    reader.readAsDataURL(signatureFile.value)
  }
}

const clearSignature = () => {
  signatureFile.value = null
  signaturePreview.value = ''
  if (signatureFileInput.value) signatureFileInput.value.value = ''
}

const saveProfile = async () => {
  saving.value = true
  error.value = ''
  successMessage.value = ''

  try {
    const payload: any = {
      displayName: displayName.value
    }

    if (signaturePreview.value) {
      payload.signatureUrl = signaturePreview.value
    } else {
      payload.signatureUrl = ''
    }

    const resp = await api.post(PROFILE_ENDPOINT, payload)
    profile.value = resp.data
    signaturePreview.value = resp.data.signatureUrl || ''
    successMessage.value = 'Teacher profile saved successfully.'
    setTimeout(() => {
      successMessage.value = ''
    }, 5000)
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Unable to save profile. Please try again.'
    console.error(err)
  } finally {
    saving.value = false
  }
}

onMounted(fetchProfile)
</script>

<template>
  <section class="parchment-card p-6 lg:p-8">
    <div class="flex items-center gap-4 mb-8">
      <div class="h-12 w-12 rounded-xl bg-[#1B2A4A]/80 border border-[#C9A84C]/20 flex items-center justify-center">
        <FileSignature class="w-5 h-5 text-[#C9A84C]" />
      </div>
      <div>
        <h3 class="academic-heading text-lg text-[#FAFAF7]">Teacher Settings</h3>
        <p class="text-sm text-[#F5F0E8]/50">Upload a signature for your form teacher reports.</p>
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-14">
      <Loader2 class="w-12 h-12 text-[#C9A84C]/50 animate-spin" />
    </div>

    <div v-else>
      <div v-if="successMessage" class="mb-6 flex items-start gap-4 rounded-xl border border-[#7A9E7E]/25 bg-[#7A9E7E]/10 p-4">
        <Check class="w-5 h-5 text-[#7A9E7E]" />
        <p class="text-sm font-bold text-[#A8C4AB]">{{ successMessage }}</p>
      </div>

      <div v-if="error" class="mb-6 flex items-start gap-4 rounded-xl border border-[#8B3A52]/25 bg-[#8B3A52]/10 p-4">
        <AlertCircle class="w-5 h-5 text-[#B45A74]" />
        <p class="text-sm font-bold text-[#B45A74]">{{ error }}</p>
      </div>

      <form @submit.prevent="saveProfile" class="space-y-8">
        <div class="grid gap-6 md:grid-cols-2">
          <div class="space-y-2">
            <label class="ml-1 text-[10px] font-black uppercase tracking-widest text-[#C9A84C]/60">Teacher Name</label>
            <input v-model="displayName" type="text" class="academic-input" placeholder="Enter name for reports" />
          </div>

          <div class="space-y-2">
            <label class="ml-1 text-[10px] font-black uppercase tracking-widest text-[#C9A84C]/60">Current Role</label>
            <input :value="profile?.role || 'TEACHER'" disabled class="academic-input bg-slate-900/70" />
          </div>
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-xs font-black uppercase tracking-widest text-[#C9A84C]/70">Signature Upload</p>
              <p class="text-[10px] text-slate-400">PNG or JPG recommended. This appears on report cards when you sign as a form teacher.</p>
            </div>
            <button type="button" @click="clearSignature" class="text-[10px] uppercase tracking-[0.3em] text-slate-300 hover:text-white">Clear</button>
          </div>

          <div class="rounded-3xl border border-slate-700/60 bg-slate-950/95 p-6">
            <div v-if="signaturePreview" class="space-y-4">
              <img :src="signaturePreview" alt="Signature preview" class="h-20 object-contain" />
              <p class="text-[10px] text-slate-400">Current signature will be used for form teacher report signatures.</p>
            </div>
            <div v-else class="flex flex-col items-center justify-center gap-3 rounded-3xl border-dashed border border-slate-700/50 p-8 text-slate-500">
              <FileSignature class="w-8 h-8" />
              <p class="text-sm font-semibold">No signature uploaded yet</p>
              <p class="text-[10px] text-slate-400">Upload a high-resolution handwritten signature image.</p>
            </div>

            <div class="mt-5 flex items-center gap-4">
              <button
                type="button"
                @click="signatureFileInput?.click()"
                class="chalkboard-btn chalkboard-btn-gold"
              >
                <span class="text-xs uppercase tracking-[0.3em]">Choose File</span>
              </button>
              <span class="text-xs text-slate-400">PNG or JPG only</span>
            </div>
            <input
              ref="signatureFileInput"
              type="file"
              accept="image/png,image/jpeg"
              class="hidden"
              @change="handleSignatureSelect"
            />
          </div>
        </div>

        <button
          type="submit"
          :disabled="saving"
          class="chalkboard-btn chalkboard-btn-gold w-full"
        >
          <component :is="saving ? Loader2 : Check" :class="{ 'animate-spin': saving }" class="w-4 h-4" />
          {{ saving ? 'Saving...' : 'Save Teacher Settings' }}
        </button>
      </form>
    </div>
  </section>
</template>
