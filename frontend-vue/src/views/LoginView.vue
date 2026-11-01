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
  btnBg: string;
  activeTabClass: string;
  iconColor: string;
  placeholderUser: string;
}> = {
  admin: {
    title: 'Admin Portal',
    roleSubtitle: 'Institutional & Academic Governance',
    icon: ShieldCheck,
    btnBg: 'bg-[#1E3A8A] hover:bg-[#172554]',
    activeTabClass: 'bg-[#1E3A8A] text-white font-black shadow-sm',
    iconColor: 'bg-[#EFF6FF] text-[#1E3A8A]',
    placeholderUser: 'Enter your admin email or username'
  },
  teacher: {
    title: 'Teacher Portal',
    roleSubtitle: 'Continuous Assessment & Examination Scores',
    icon: BookOpen,
    btnBg: 'bg-[#059669] hover:bg-[#047857]',
    activeTabClass: 'bg-[#059669] text-white font-black shadow-sm',
    iconColor: 'bg-[#ECFDF5] text-[#059669]',
    placeholderUser: 'Enter your email or teacher code'
  },
  parent: {
    title: 'Parent Portal',
    roleSubtitle: 'Ward Academic Performance & Reports',
    icon: Users,
    btnBg: 'bg-[#D97706] hover:bg-[#B45309]',
    activeTabClass: 'bg-[#D97706] text-white font-black shadow-sm',
    iconColor: 'bg-[#FFFBEB] text-[#D97706]',
    placeholderUser: 'Enter your parent username'
  },
  student: {
    title: 'Student Portal',
    roleSubtitle: 'Terminal Results & Registered Subjects',
    icon: GraduationCap,
    btnBg: 'bg-[#2563EB] hover:bg-[#1D4ED8]',
    activeTabClass: 'bg-[#2563EB] text-white font-black shadow-sm',
    iconColor: 'bg-[#EFF6FF] text-[#2563EB]',
    placeholderUser: 'e.g. fvs-2026-0378'
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
  <div class="min-h-screen bg-transparent flex flex-col justify-center py-6 px-4 sm:px-6 lg:px-8 text-[#0F172A] antialiased">
    
    <!-- Top Back Link -->
    <div class="mx-auto w-full max-w-md mb-4 flex items-center justify-between">
      <router-link to="/" class="inline-flex items-center gap-1.5 text-xs font-black text-[#0C4A6E] hover:text-amber-700 hover:underline transition-colors">
        <ArrowLeft class="w-4 h-4" />
        Return to Home
      </router-link>
      <span class="text-[11px] font-black uppercase tracking-wider text-amber-900 bg-amber-100/90 border border-amber-300 px-2.5 py-0.5 rounded-full">
        Secure Portal
      </span>
    </div>

    <!-- Login Container -->
    <div class="mx-auto w-full max-w-md">
      
      <!-- Responsive Portal Selector Tabs (2x2 on mobile, row on tablet) -->
      <div class="bg-white/95 p-1.5 rounded-2xl border-2 border-[#BAE6FD] shadow-md mb-4 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        <button
          v-for="key in portalKeys"
          :key="key"
          @click="selectPortal(key)"
          class="py-2.5 px-2 rounded-xl text-xs font-extrabold capitalize transition-all duration-150 flex items-center justify-center gap-1.5"
          :class="[
            portal === key 
              ? portalConfig[key].activeTabClass 
              : 'text-slate-700 hover:bg-sky-50 hover:text-sky-900 font-bold'
          ]"
        >
          <component :is="portalConfig[key].icon" class="w-4 h-4 shrink-0" />
          <span>{{ key }}</span>
        </button>
      </div>

      <!-- Main Login Card -->
      <div class="bg-white/95 backdrop-blur-md rounded-2xl border-2 border-[#BAE6FD] p-6 sm:p-8 shadow-xl">
        
        <!-- School Crest & Header -->
        <div class="text-center mb-6">
          <div class="mx-auto h-16 w-16 rounded-2xl bg-white p-1 border-2 border-amber-300 shadow-md flex items-center justify-center mb-3">
            <img src="/logo.png" alt="Folusho Victory Schools" class="h-full w-full object-contain" />
          </div>
          
          <h1 class="text-xl sm:text-2xl font-black text-[#0C4A6E]">
            {{ currentConfig.title }}
          </h1>
          <p class="text-xs sm:text-sm text-slate-700 font-extrabold mt-1">
            {{ currentConfig.roleSubtitle }}
          </p>
        </div>

        <!-- Error Message Alert -->
        <div
          v-if="error"
          class="mb-4 flex items-start gap-2.5 rounded-xl border-2 border-red-300 bg-red-50 p-3.5 text-xs font-bold text-red-900"
        >
          <AlertCircle class="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
          <span>{{ error }}</span>
        </div>

        <!-- Teacher Setup Prompt -->
        <div 
          v-if="needSignup && portal === 'teacher'" 
          class="mb-4 text-xs font-bold text-amber-900 bg-amber-50 border-2 border-amber-300 rounded-xl p-3"
        >
          Your teacher invitation code needs registration. 
          <router-link to="/register/teacher" class="underline font-black text-amber-950 ml-1">
            Click here to complete registration
          </router-link>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleLogin" class="space-y-4">
          
          <!-- Username / Admission Number -->
          <div>
            <label class="block text-xs font-black uppercase tracking-wider text-[#0F172A] mb-1.5">
              {{ portal === 'student' ? 'Admission Number' : portal === 'teacher' ? 'Email or Teacher Code' : 'Email or Username' }}
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User class="h-4 w-4" />
              </div>
              <input
                v-model="username"
                type="text"
                required
                class="w-full pl-10 pr-3 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-base font-bold text-[#0F172A] focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-500/20 placeholder:text-slate-400 transition-all shadow-sm"
                :placeholder="currentConfig.placeholderUser"
              />
            </div>
          </div>

          <!-- Password / 8-digit PIN -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="block text-xs font-black uppercase tracking-wider text-[#0F172A]">
                {{ portal === 'student' ? '8-Digit Student PIN' : 'Password' }}
              </label>
            </div>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock class="h-4 w-4" />
              </div>
              <input
                v-model="password"
                :type="portal === 'student' || passwordVisible ? 'text' : 'password'"
                :inputmode="portal === 'student' ? 'numeric' : undefined"
                :maxlength="portal === 'student' ? 8 : undefined"
                :pattern="portal === 'student' ? '[0-9]{8}' : undefined"
                required
                class="w-full pl-10 pr-10 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-base font-bold text-[#0F172A] focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-500/20 placeholder:text-slate-400 transition-all shadow-sm"
                :placeholder="portal === 'student' ? 'Enter your 8-digit PIN' : 'Enter your password'"
              />
              <button
                v-if="portal !== 'student'"
                type="button"
                @click="passwordVisible = !passwordVisible"
                class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-900"
                tabindex="-1"
              >
                <Eye v-if="!passwordVisible" class="h-4 w-4" />
                <EyeOff v-else class="h-4 w-4" />
              </button>
            </div>
          </div>

          <!-- Sign In Submit Button (Bold Pure White Text) -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full py-3 px-4 rounded-xl text-sm font-black text-white flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 mt-2"
            :class="[currentConfig.btnBg, loading ? 'opacity-70 cursor-not-allowed' : '']"
          >
            <Loader2 v-if="loading" class="h-4 w-4 animate-spin text-white" />
            <span v-else class="text-white">Sign In to {{ portal.toUpperCase() }}</span>
          </button>
        </form>

        <!-- Help Link -->
        <div class="mt-5 pt-4 border-t border-slate-200 text-center">
          <router-link 
            :to="`/forgot-password/${portal}`" 
            class="text-xs font-black text-sky-800 hover:text-amber-700 hover:underline transition-colors"
          >
            {{ portal === 'student' ? 'Forgot your 8-digit student PIN?' : 'Forgot password or need help signing in?' }}
          </router-link>
        </div>

      </div>

      <!-- Security Notice -->
      <div class="mt-4 text-center">
        <p class="text-xs font-bold text-slate-800">
          Folusho Victory Schools • Official Academic System
        </p>
      </div>

    </div>
  </div>
</template>
