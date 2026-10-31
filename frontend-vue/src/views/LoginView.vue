<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Lock, User, Loader2, AlertCircle, Eye, EyeOff, ShieldCheck, BookOpen, Users, GraduationCap, ArrowLeft } from 'lucide-vue-next'

import api from '../services/api'
import { useAuthStore } from '../stores/authStore'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

type PortalKey = 'admin' | 'teacher' | 'parent' | 'student'
const portalKeys = ['admin', 'teacher', 'parent', 'student'] as const

const validPortal = (value?: string | string[] | null): value is PortalKey => {
  if (Array.isArray(value)) {
    value = value[0]
  }
  return typeof value === 'string' && portalKeys.includes(value as PortalKey)
}

const normalizePortal = (value?: string | string[] | null): PortalKey => {
  const raw = Array.isArray(value) ? value[0] : value
  const lower = String(raw || '').toLowerCase()
  return validPortal(lower) ? lower : 'admin'
}

const getSavedPortal = (): PortalKey | null => {
  if (typeof window === 'undefined') return null
  const saved = localStorage.getItem('lastPortal')
  return validPortal(saved) ? saved : null
}

const portal = ref<PortalKey>(normalizePortal(route.params.portal as string | string[] | null))
const username = ref('')
const password = ref('')
const passwordVisible = ref(false)
const loading = ref(false)
const error = ref('')
const needSignup = ref(false)

const portalConfig: Record<PortalKey, {
  title: string;
  roleSubtitle: string;
  icon: any;
  btnClass: string;
  activeTabClass: string;
  iconBg: string;
}> = {
  admin: {
    title: 'Admin Portal',
    roleSubtitle: 'Institutional & Academic Governance',
    icon: ShieldCheck,
    btnClass: 'bg-[#1A4D8F] hover:bg-[#12386A] text-white',
    activeTabClass: 'bg-[#1A4D8F] text-white shadow-sm',
    iconBg: 'bg-[#1A4D8F]/10 text-[#1A4D8F]'
  },
  teacher: {
    title: 'Teacher Portal',
    roleSubtitle: 'Curriculum & Score Management',
    icon: BookOpen,
    btnClass: 'bg-[#2D6A4F] hover:bg-[#1F4D38] text-white',
    activeTabClass: 'bg-[#2D6A4F] text-white shadow-sm',
    iconBg: 'bg-[#2D6A4F]/10 text-[#2D6A4F]'
  },
  parent: {
    title: 'Parent Portal',
    roleSubtitle: 'Ward Academic Performance & Progress',
    icon: Users,
    btnClass: 'bg-[#C98818] hover:bg-[#9E670B] text-white',
    activeTabClass: 'bg-[#E8A838] text-white shadow-sm',
    iconBg: 'bg-[#E8A838]/15 text-[#C98818]'
  },
  student: {
    title: 'Student Portal',
    roleSubtitle: 'Personal Results & Term Assessment',
    icon: GraduationCap,
    btnClass: 'bg-[#2B6CB0] hover:bg-[#1E4E80] text-white',
    activeTabClass: 'bg-[#2B6CB0] text-white shadow-sm',
    iconBg: 'bg-[#2B6CB0]/10 text-[#2B6CB0]'
  }
}

const currentConfig = computed(() => portalConfig[portal.value])

const selectPortal = (selected: PortalKey) => {
  portal.value = selected
  error.value = ''
  localStorage.setItem('lastPortal', selected)
  router.replace({ params: { ...route.params, portal: selected } }).catch(() => {})
}

onMounted(() => {
  const saved = getSavedPortal()
  if (!validPortal(route.params.portal as string | string[] | null) && saved) {
    portal.value = saved
    router.replace({ params: { ...route.params, portal: saved } }).catch(() => {})
  }
  if (validPortal(portal.value)) {
    localStorage.setItem('lastPortal', portal.value)
  }
})

watch(
  () => route.params.portal,
  (next: string | string[] | null) => {
    const normalized = normalizePortal(next)
    if (normalized !== portal.value) {
      portal.value = normalized
      localStorage.setItem('lastPortal', normalized)
    }
  }
)

const handleLogin = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await api.post('/api/auth/login', {
      username: username.value,
      password: password.value,
      portal: portal.value
    })

    authStore.setToken(response.data.token)
    authStore.setUser(response.data.user)

    const redirectPath = `/${portal.value}`
    router.push(redirectPath)
  } catch (err: any) {
    const serverCode = err.response?.data?.code
    error.value = err.response?.data?.error || err.response?.data?.message || 'Login failed. Please check your credentials.'
    needSignup.value = serverCode === 'NEED_SIGNUP'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#F7F4EE] flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 text-[#1C1917]">
    
    <!-- Top Back Link -->
    <div class="mx-auto w-full max-w-md mb-4 flex items-center justify-between">
      <router-link to="/" class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B7280] hover:text-[#1A4D8F] transition-colors">
        <ArrowLeft class="w-4 h-4" />
        Back to Folusho Victory Home
      </router-link>
      <span class="text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">
        Portal Authentication
      </span>
    </div>

    <!-- Main Container -->
    <div class="mx-auto w-full max-w-md">
      
      <!-- Portal Selector Pills -->
      <div class="bg-white p-1.5 rounded-2xl border border-[#E5E0D8] shadow-sm mb-5 flex items-center justify-between gap-1">
        <button
          v-for="key in portalKeys"
          :key="key"
          @click="selectPortal(key)"
          class="flex-1 py-2 px-2 rounded-xl text-xs font-bold capitalize transition-all duration-200 flex items-center justify-center gap-1.5"
          :class="[
            portal === key 
              ? portalConfig[key].activeTabClass 
              : 'text-[#6B7280] hover:bg-[#F7F4EE] hover:text-[#1C1917]'
          ]"
        >
          <component :is="portalConfig[key].icon" class="w-3.5 h-3.5" />
          <span>{{ key }}</span>
        </button>
      </div>

      <!-- Login Card -->
      <div class="bg-white rounded-2xl border border-[#E5E0D8] p-6 sm:p-8 shadow-sm">
        
        <!-- Header -->
        <div class="text-center mb-6">
          <div class="mx-auto h-14 w-14 rounded-2xl bg-white p-1 border border-[#E5E0D8] shadow-sm flex items-center justify-center mb-3">
            <img src="/logo.png" alt="Folusho Victory Schools" class="h-full w-full object-contain" />
          </div>
          
          <h1 class="text-xl sm:text-2xl font-extrabold text-[#1C1917]">
            {{ currentConfig.title }}
          </h1>
          <p class="text-xs text-[#6B7280] mt-1">
            {{ currentConfig.roleSubtitle }}
          </p>
        </div>

        <!-- Error Alert -->
        <div
          v-if="error"
          class="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700"
        >
          <AlertCircle class="h-4 w-4 shrink-0 mt-0.5" />
          <span>{{ error }}</span>
        </div>

        <!-- Teacher Registration Prompt -->
        <div 
          v-if="needSignup && portal === 'teacher'" 
          class="mb-5 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3"
        >
          It looks like your teacher account needs initial setup. 
          <router-link to="/register/teacher" class="underline font-bold text-amber-900 ml-1">
            Complete registration
          </router-link>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleLogin" class="space-y-4">
          <!-- Identifier -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-[#4B5563] mb-1.5">
              {{ portal === 'student' ? 'Admission Number' : portal === 'teacher' ? 'Email or Teacher Code' : 'Email or Username' }}
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9CA3AF]">
                <User class="h-4 w-4" />
              </div>
              <input
                v-model="username"
                type="text"
                required
                class="w-full pl-10 pr-3 py-2.5 bg-white border border-[#D8D2C4] rounded-xl text-sm text-[#1C1917] focus:outline-none focus:border-[#1A4D8F] focus:ring-2 focus:ring-[#1A4D8F]/10 placeholder:text-[#9CA3AF] transition-all"
                :placeholder="portal === 'student' ? 'e.g. fvs-2026-0378' : portal === 'teacher' ? 'e.g. teacher@fvs.edu.ng' : 'Enter your username or email'"
              />
            </div>
          </div>

          <!-- Secret / PIN -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="block text-xs font-bold uppercase tracking-wider text-[#4B5563]">
                {{ portal === 'student' ? '8-Digit Student PIN' : 'Password' }}
              </label>
            </div>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9CA3AF]">
                <Lock class="h-4 w-4" />
              </div>
              <input
                v-model="password"
                :type="portal === 'student' || passwordVisible ? 'text' : 'password'"
                :inputmode="portal === 'student' ? 'numeric' : undefined"
                :maxlength="portal === 'student' ? 8 : undefined"
                :pattern="portal === 'student' ? '[0-9]{8}' : undefined"
                required
                class="w-full pl-10 pr-10 py-2.5 bg-white border border-[#D8D2C4] rounded-xl text-sm text-[#1C1917] focus:outline-none focus:border-[#1A4D8F] focus:ring-2 focus:ring-[#1A4D8F]/10 placeholder:text-[#9CA3AF] transition-all"
                :placeholder="portal === 'student' ? '8-digit PIN' : 'Enter your password'"
              />
              <button
                v-if="portal !== 'student'"
                type="button"
                @click="passwordVisible = !passwordVisible"
                class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#9CA3AF] hover:text-[#4B5563]"
              >
                <Eye v-if="!passwordVisible" class="h-4 w-4" />
                <EyeOff v-else class="h-4 w-4" />
              </button>
            </div>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99] mt-2"
            :class="[currentConfig.btnClass, loading ? 'opacity-70 cursor-not-allowed' : '']"
          >
            <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
            <span v-else>Sign In to {{ portal.toUpperCase() }}</span>
          </button>
        </form>

        <!-- Help Link -->
        <div class="mt-5 pt-4 border-t border-[#E5E0D8] text-center">
          <router-link 
            :to="`/forgot-password/${portal}`" 
            class="text-xs font-semibold text-[#6B7280] hover:text-[#1A4D8F] transition-colors"
          >
            {{ portal === 'student' ? 'Forgot your 8-digit PIN?' : 'Need assistance or forgot password?' }}
          </router-link>
        </div>

      </div>

      <!-- Security Notice -->
      <div class="mt-4 text-center">
        <p class="text-[11px] text-[#8C827A]">
          Official Portal of Folusho Victory Schools • Secure Session
        </p>
      </div>

    </div>
  </div>
</template>
