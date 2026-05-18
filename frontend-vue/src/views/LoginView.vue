<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Lock, User, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-vue-next'

import api from '../services/api'
import { useAuthStore } from '../stores/authStore'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

type PortalKey = 'admin' | 'teacher' | 'parent'
const portalKeys = ['admin', 'teacher', 'parent'] as const

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

const portalConfig: Record<PortalKey, {
  title: string;
  label: string;
  emoji: string;
  accentText: string;
  accentLine: string;
  button: string;
  shadow: string;
  gateway: string;
  usernameLabel: string;
  usernamePlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  forgotText: string;
  forgotPath: string;
}> = {
  admin: {
    title: 'Administrator',
    label: 'Admin',
    emoji: '🛡️',
    accentText: 'nebula-gradient',
    accentLine: 'bg-nebula-500/30',
    button: 'nebula-gradient',
    shadow: 'shadow-nebula-500/30',
    gateway: 'text-nebula-500',
    usernameLabel: 'Employee ID',
    usernamePlaceholder: 'Employee ID',
    passwordLabel: 'Admin Passphrase',
    passwordPlaceholder: 'Enter secure passphrase',
    forgotText: 'Forgot Admin Passphrase?',
    forgotPath: '/forgot-password/admin'
  },
  teacher: {
    title: 'Academic Staff',
    label: 'Teacher',
    emoji: '📚',
    accentText: 'from-purple-600 via-indigo-600 to-pink-600 bg-gradient-to-r',
    accentLine: 'bg-purple-500/30',
    button: 'bg-gradient-to-r from-purple-600 to-indigo-600',
    shadow: 'shadow-purple-600/30',
    gateway: 'text-purple-600',
    usernameLabel: 'Staff Code',
    usernamePlaceholder: 'Staff Code',
    passwordLabel: 'Staff Secret',
    passwordPlaceholder: 'Enter staff passphrase',
    forgotText: 'Forgot Staff Secret?',
    forgotPath: '/forgot-password/teacher'
  },
  parent: {
    title: 'Parent/Guardian',
    label: 'Parent',
    emoji: '👪',
    accentText: 'from-emerald-600 to-teal-600 bg-gradient-to-r',
    accentLine: 'bg-emerald-500/30',
    button: 'bg-gradient-to-r from-emerald-600 to-teal-600',
    shadow: 'shadow-emerald-600/30',
    gateway: 'text-emerald-600',
    usernameLabel: 'Parent ID',
    usernamePlaceholder: 'Parent ID',
    passwordLabel: 'Parent Access Code',
    passwordPlaceholder: 'Enter access code',
    forgotText: 'Forgot Parent Access Code?',
    forgotPath: '/forgot-password/parent'
  }
}

const portalTitle = computed(() => portalConfig[portal.value].title)
const portalAccentTextClass = computed(() => portalConfig[portal.value].accentText)
const portalAccentLineClass = computed(() => portalConfig[portal.value].accentLine)
const portalButtonClass = computed(() => portalConfig[portal.value].button)
const portalEmoji = computed(() => portalConfig[portal.value].emoji)
const portalShadowClass = computed(() => portalConfig[portal.value].shadow)
const portalSecureGatewayClass = computed(() => portalConfig[portal.value].gateway)
const usernameLabel = computed(() => portalConfig[portal.value].usernameLabel)
const usernamePlaceholder = computed(() => portalConfig[portal.value].usernamePlaceholder)
const passwordLabel = computed(() => portalConfig[portal.value].passwordLabel)
const passwordPlaceholder = computed(() => portalConfig[portal.value].passwordPlaceholder)
const forgotLinkText = computed(() => portalConfig[portal.value].forgotText)
const forgotLinkPath = computed(() => portalConfig[portal.value].forgotPath)

const portalOptions = portalKeys

const selectPortal = (selected: PortalKey) => {
  portal.value = selected
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
    const portalUpper = portal.value.toUpperCase()
    const { data } = await api.post('/api/auth/login', {
      portal: portalUpper,
      username: username.value.trim(),
      password: password.value
    })
    
    authStore.setAuth(data.user, data.token)
    
    // Redirect based on portal
    router.push(`/${portal.value}`)
  } catch (err: any) {
    console.error('Login error:', err)
    error.value = err.response?.data?.error || err.message || 'Authentication failed. Please check your credentials.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#020617] px-3 sm:px-4 py-8 sm:py-12 relative overflow-hidden">

    <div class="w-full max-w-md space-y-6 sm:space-y-8 lg:space-y-10 fade-in relative z-10">
      <!-- Logo and Header -->
      <div class="text-center">
        <div class="relative inline-block group">
          <div class="absolute inset-0 bg-nebula-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" aria-hidden="true"></div>
          <div class="relative mx-auto h-20 sm:h-24 w-20 sm:w-24 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-[2rem] p-3 sm:p-4 shadow-2xl border border-white/50 dark:border-slate-700 flex items-center justify-center mb-6 sm:mb-8 transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
            <img src="/logo.png" alt="Folusho Victory Schools Logo" class="object-contain w-full h-full" />
          </div>
        </div>
        
        <div class="space-y-2">
          <div class="flex items-center justify-center gap-3">
            <div class="h-px w-6 sm:w-8" :class="portalAccentLineClass" aria-hidden="true"></div>
            <span class="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.4em]" :class="portalSecureGatewayClass">Secure Gateway</span>
            <div class="h-px w-6 sm:w-8" :class="portalAccentLineClass" aria-hidden="true"></div>
          </div>
          <h2 class="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
            {{ portalTitle }} <span class="ml-2">{{ portalEmoji }}</span> <span :class="['text-transparent bg-clip-text', portalAccentTextClass]">Login</span>
          </h2>
          <p class="text-[9px] sm:text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em]">
            Institutional Control & Academic Management
          </p>
        </div>
      </div>

      <transition name="portal-card" mode="out-in">
        <div :key="portal" class="bg-white dark:bg-slate-950/90 rounded-xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-md">
          <form @submit.prevent="handleLogin" class="space-y-5 sm:space-y-6 lg:space-y-8" novalidate>
            <h3 id="login-title" class="sr-only">Login Form</h3>
            
            <!-- Error Alert -->
            <div v-if="error" class="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-lg sm:rounded-2xl p-3 sm:p-4 flex items-start gap-3 animate-shake" role="alert" id="login-error">
              <AlertCircle class="w-4 sm:w-5 h-4 sm:h-5 text-rose-500 shrink-0 mt-0.5" aria-hidden="true" />
              <p class="text-xs sm:text-sm font-bold text-rose-700 dark:text-rose-400 leading-snug">{{ error }}</p>
            </div>

            <!-- Username Field -->
            <div class="space-y-2">
              <label for="username" class="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-3 sm:ml-4">{{ usernameLabel }}</label>
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-4 sm:pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-nebula-500 transition-colors duration-300">
                  <User class="h-4 sm:h-5 w-4 sm:w-5" aria-hidden="true" />
                </div>
                <input 
                  id="username"
                  v-model="username"
                  type="text" 
                  required
                  autocomplete="username"
                  class="block w-full pl-12 sm:pl-14 pr-4 sm:pr-6 py-4 sm:py-5 bg-slate-100/50 dark:bg-slate-800/50 border border-transparent rounded-lg sm:rounded-[1.5rem] text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-nebula-500/30 focus:ring-4 focus:ring-nebula-500/10 transition-all outline-none font-bold text-sm sm:text-base min-h-[44px]"
                  :placeholder="usernamePlaceholder"
                  :aria-invalid="!!error"
                  aria-describedby="login-error"
                />
              </div>
            </div>

            <!-- Password Field -->
            <div class="space-y-2">
              <label for="password" class="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-3 sm:ml-4">{{ passwordLabel }}</label>
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-4 sm:pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-nebula-500 transition-colors duration-300">
                  <Lock class="h-4 sm:h-5 w-4 sm:w-5" aria-hidden="true" />
                </div>
                <input 
                  id="password"
                  v-model="password"
                  :type="passwordVisible ? 'text' : 'password'"
                  required
                  autocomplete="current-password"
                  class="block w-full pl-12 sm:pl-14 pr-12 sm:pr-14 py-4 sm:py-5 bg-slate-100/50 dark:bg-slate-800/50 border border-transparent rounded-lg sm:rounded-[1.5rem] text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-nebula-500/30 focus:ring-4 focus:ring-nebula-500/10 transition-all outline-none font-bold text-sm sm:text-base min-h-[44px]"
                  :placeholder="passwordPlaceholder"
                  :aria-invalid="!!error"
                  aria-describedby="login-error"
                />
                <button
                  type="button"
                  @click="passwordVisible = !passwordVisible"
                  :aria-label="passwordVisible ? 'Hide password' : 'Show password'"
                  class="absolute inset-y-0 right-0 pr-4 sm:pr-5 flex items-center text-slate-400 hover:text-nebula-500 transition-colors duration-300 focus-visible:ring-4 focus-visible:ring-nebula-500/40 rounded"
                >
                  <Eye v-if="!passwordVisible" class="h-4 sm:h-5 w-4 sm:w-5" aria-hidden="true" />
                  <EyeOff v-else class="h-4 sm:h-5 w-4 sm:w-5" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <button 
                type="submit"
                :disabled="loading"
                :class="[portalButtonClass, 'w-full flex items-center justify-center rounded-lg sm:rounded-[1.5rem] px-6 sm:px-8 py-4 sm:py-5 text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-white shadow-2xl hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 focus-visible:ring-4 focus-visible:ring-nebula-500/40 min-h-[48px]', portalShadowClass]"
                :aria-label="loading ? 'Authenticating...' : 'Authorize Access'"
              >
                <Loader2 v-if="loading" class="w-4 sm:w-5 h-4 sm:h-5 animate-spin mr-2 sm:mr-3" aria-hidden="true" />
                <span>{{ loading ? 'Authenticating' : 'Authorize Access' }}</span>
              </button>
              <router-link
                :to="forgotLinkPath"
                class="text-[10px] sm:text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-nebula-600 dark:hover:text-emerald-300 transition-colors"
              >
                {{ forgotLinkText }}
              </router-link>
            </div>
          </form>

          <!-- Portal Selection -->
          <div class="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-slate-200 dark:border-slate-800/50">
            <div class="flex flex-col gap-3 sm:gap-4">
              <span class="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 text-center">Switch Operational Portal</span>
              <div class="flex justify-center gap-2 sm:gap-3 flex-wrap" role="group" aria-label="Portal Selection">
                <button 
                  v-for="p in portalOptions" 
                  :key="p"
                  @click="selectPortal(p)" 
                  :aria-pressed="portal === p"
                  :class="[portal === p ? 'bg-nebula-500 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700']" 
                  class="px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all duration-300 min-w-[90px] sm:min-w-[100px] min-h-[44px] focus-visible:ring-4 focus-visible:ring-nebula-500/40"
                  type="button"
                >
                  <span class="mr-2">{{ portalConfig[p].emoji }}</span>
                  <span class="inline-block text-[10px] sm:text-[11px] uppercase tracking-[0.18em]">{{ portalConfig[p].label }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </transition>
      
      <!-- Footer -->
      <div class="text-center space-y-3 sm:space-y-4">
        <p class="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          &copy; 2026 Folusho Victory Schools. Unified Academic Engine.
        </p>
        <div class="flex justify-center gap-4 sm:gap-6 opacity-30 group" aria-hidden="true">
          <div class="h-1 w-6 sm:w-8 bg-nebula-500 rounded-full group-hover:w-10 sm:group-hover:w-12 transition-all"></div>
          <div class="h-1 w-6 sm:w-8 bg-purple-500 rounded-full group-hover:w-10 sm:group-hover:w-12 transition-all"></div>
          <div class="h-1 w-6 sm:w-8 bg-emerald-500 rounded-full group-hover:w-10 sm:group-hover:w-12 transition-all"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.portal-card-enter-active,
.portal-card-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.portal-card-enter-from,
.portal-card-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
.portal-card-enter-to,
.portal-card-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>
