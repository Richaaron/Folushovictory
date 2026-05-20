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
    accentText: 'from-royal-purple to-royal-gold bg-gradient-to-r',
    accentLine: 'bg-royal-gold/30',
    button: 'bg-gradient-to-r from-royal-purple to-royal-gold',
    shadow: 'shadow-[0_28px_80px_rgba(212,175,55,0.28)]',
    gateway: 'text-royal-gold',
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
    accentText: 'from-royal-purple to-royal-gold bg-gradient-to-r',
    accentLine: 'bg-royal-purple/30',
    button: 'bg-gradient-to-r from-royal-purple via-indigo-700 to-royal-gold',
    shadow: 'shadow-[0_28px_80px_rgba(88,28,135,0.30)]',
    gateway: 'text-royal-purple',
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
    accentText: 'from-royal-gold to-amber-400 bg-gradient-to-r',
    accentLine: 'bg-royal-gold/30',
    button: 'bg-gradient-to-r from-royal-gold via-amber-400 to-slate-200',
    shadow: 'shadow-[0_28px_80px_rgba(212,175,55,0.24)]',
    gateway: 'text-royal-gold',
    usernameLabel: 'Parent ID',
    usernamePlaceholder: 'Parent ID',
    passwordLabel: 'Parent Access Code',
    passwordPlaceholder: 'Enter access code',
    forgotText: 'Forgot Parent Access Code?',
    forgotPath: '/forgot-password/parent'
  }
}

const portalTitle = computed(() => portalConfig[portal.value].title)
const portalButtonClass = computed(() => portalConfig[portal.value].button)
const portalEmoji = computed(() => portalConfig[portal.value].emoji)
const portalShadowClass = computed(() => portalConfig[portal.value].shadow)
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
  <div class="min-h-screen relative overflow-hidden bg-[#020617] px-3 sm:px-4 py-10 sm:py-16">
    <div class="absolute inset-x-0 top-0 h-96 bg-[radial-gradient(circle_at_top_left,rgba(88,28,135,0.32),transparent_24%),radial-gradient(circle_at_top_right,rgba(212,175,55,0.18),transparent_28%)] pointer-events-none" />
    <div class="absolute left-1/4 top-1/3 h-72 w-72 rounded-full bg-royal-purple/10 blur-3xl" />
    <div class="absolute right-1/4 bottom-16 h-64 w-64 rounded-full bg-royal-gold/10 blur-3xl" />

    <div class="relative mx-auto w-full max-w-6xl">
      <div class="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div class="hidden lg:block">
          <div class="sticky top-28 rounded-[2rem] border border-royal-gold/20 bg-slate-950/80 p-8 shadow-[0_40px_120px_rgba(0,0,0,0.40)] backdrop-blur-xl">
            <p class="text-xs uppercase tracking-[0.35em] text-slate-400">Institutional Control</p>
            <h1 class="mt-6 text-3xl font-black text-white leading-tight">Secure access across administration, teaching, and parental support.</h1>
            <p class="mt-5 text-sm leading-7 text-slate-300">Manage academic records, classroom workflows, and guardian communication from one polished digital gateway.</p>
            <div class="mt-8 flex flex-wrap gap-3">
              <span class="rounded-full border border-royal-purple/20 bg-royal-purple/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.26em] text-royal-purple">Trusted</span>
              <span class="rounded-full border border-royal-gold/20 bg-royal-gold/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.26em] text-royal-gold">Connected</span>
            </div>
          </div>
        </div>

        <div class="relative z-10">
          <div class="relative overflow-hidden rounded-[2rem] border border-slate-800/80 bg-slate-950/95 p-6 sm:p-8 md:p-10 shadow-[0_40px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl">
            <div class="absolute -left-10 top-4 h-24 w-24 rounded-full bg-royal-purple/10 blur-3xl" />
            <div class="absolute -right-10 bottom-10 h-32 w-32 rounded-full bg-royal-gold/10 blur-3xl" />

            <div class="relative space-y-8">
              <div class="space-y-6 text-center">
                <div class="inline-flex rounded-full border border-royal-gold/20 bg-slate-900/90 px-4 py-2 text-sm font-black uppercase tracking-[0.35em] text-royal-gold shadow-[0_18px_40px_rgba(212,175,55,0.18)]">
                  Secure Gateway
                </div>
                <h2 class="text-3xl sm:text-4xl font-black tracking-tight text-white">
                  {{ portalTitle }} <span class="ml-2">{{ portalEmoji }}</span>
                </h2>
                <p class="text-sm text-slate-400 uppercase tracking-[0.2em]">Institutional Control & Academic Management</p>
              </div>

              <transition name="portal-card" mode="out-in">
                <div :key="portal" class="space-y-6">
                  <form @submit.prevent="handleLogin" class="space-y-6" novalidate>
                    <div v-if="error" class="rounded-[1.5rem] border border-rose-600/20 bg-rose-500/10 p-4 text-sm text-rose-100 shadow-[0_20px_60px_rgba(245,115,115,0.15)] animate-shake" role="alert" id="login-error">
                      <div class="flex items-center gap-3">
                        <AlertCircle class="h-5 w-5 text-rose-300" aria-hidden="true" />
                        <p class="font-semibold">{{ error }}</p>
                      </div>
                    </div>

                    <div class="space-y-3">
                      <div class="flex items-center justify-between gap-4">
                        <label for="username" class="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">{{ usernameLabel }}</label>
                        <span class="text-[10px] uppercase tracking-[0.28em] text-slate-500">Use your secure ID</span>
                      </div>
                      <div class="relative rounded-[1.5rem] border border-slate-800/80 bg-slate-900/90 px-4 py-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                        <div class="absolute inset-y-0 left-4 flex items-center text-royal-gold">
                          <User class="h-5 w-5" aria-hidden="true" />
                        </div>
                        <input
                          id="username"
                          v-model="username"
                          type="text"
                          required
                          autocomplete="username"
                          class="w-full bg-transparent pl-14 pr-4 text-sm text-white placeholder-slate-500 outline-none"
                          :placeholder="usernamePlaceholder"
                          :aria-invalid="!!error"
                          aria-describedby="login-error"
                        />
                      </div>
                    </div>

                    <div class="space-y-3">
                      <div class="flex items-center justify-between gap-4">
                        <label for="password" class="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">{{ passwordLabel }}</label>
                        <span class="text-[10px] uppercase tracking-[0.28em] text-slate-500">Protected access</span>
                      </div>
                      <div class="relative rounded-[1.5rem] border border-slate-800/80 bg-slate-900/90 px-4 py-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                        <div class="absolute inset-y-0 left-4 flex items-center text-royal-gold">
                          <Lock class="h-5 w-5" aria-hidden="true" />
                        </div>
                        <input
                          id="password"
                          v-model="password"
                          :type="passwordVisible ? 'text' : 'password'"
                          required
                          autocomplete="current-password"
                          class="w-full bg-transparent pl-14 pr-12 text-sm text-white placeholder-slate-500 outline-none"
                          :placeholder="passwordPlaceholder"
                          :aria-invalid="!!error"
                          aria-describedby="login-error"
                        />
                        <button
                          type="button"
                          @click="passwordVisible = !passwordVisible"
                          :aria-label="passwordVisible ? 'Hide password' : 'Show password'"
                          class="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-white transition-colors"
                        >
                          <Eye v-if="!passwordVisible" class="h-5 w-5" aria-hidden="true" />
                          <EyeOff v-else class="h-5 w-5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <button
                        type="submit"
                        :disabled="loading"
                        :class="[portalButtonClass, 'w-full sm:w-auto flex items-center justify-center rounded-[1.5rem] px-6 py-4 text-sm font-black uppercase tracking-[0.2em] text-white transition-transform duration-200 focus-visible:ring-4 focus-visible:ring-royal-purple/30', portalShadowClass]"
                        :aria-label="loading ? 'Authenticating...' : 'Authorize Access'"
                      >
                        <Loader2 v-if="loading" class="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                        <span>{{ loading ? 'Authenticating' : 'Authorize Access' }}</span>
                      </button>
                      <router-link
                        :to="forgotLinkPath"
                        class="text-sm font-bold text-slate-400 hover:text-white transition-colors"
                      >
                        {{ forgotLinkText }}
                      </router-link>
                    </div>
                  </form>

                  <div class="rounded-[1.5rem] border border-slate-800/80 bg-slate-900/90 px-5 py-4">
                    <p class="text-[9px] font-black uppercase tracking-[0.28em] text-slate-500 text-center mb-3">Switch Operational Portal</p>
                    <div class="flex flex-wrap justify-center gap-3">
                      <button
                        v-for="p in portalOptions"
                        :key="p"
                        @click="selectPortal(p)"
                        :aria-pressed="portal === p"
                        :class="portal === p ? 'bg-royal-purple text-white shadow-[0_18px_45px_rgba(88,28,135,0.24)]' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'"
                        class="inline-flex items-center gap-2 rounded-full px-5 py-3 text-[10px] font-black uppercase tracking-[0.25em] transition-all duration-200"
                        type="button"
                      >
                        <span>{{ portalConfig[p].emoji }}</span>
                        <span>{{ portalConfig[p].label }}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </transition>
            </div>

            <div class="pt-6 text-center text-slate-500">
              <p class="text-[10px] uppercase tracking-[0.2em]">© 2026 Folusho Victory Schools. Unified Academic Engine.</p>
              <div class="mt-4 flex items-center justify-center gap-2 opacity-30">
                <span class="block h-1 w-8 rounded-full bg-royal-purple"></span>
                <span class="block h-1 w-8 rounded-full bg-royal-gold"></span>
                <span class="block h-1 w-8 rounded-full bg-slate-600"></span>
              </div>
            </div>
          </div>
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
  transform: translateY(12px);
}
.portal-card-enter-to,
.portal-card-leave-from {
  opacity: 1;
  transform: translateY(0);
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-3px); }
  50% { transform: translateX(3px); }
  75% { transform: translateX(-2px); }
}

.animate-shake {
  animation: shake 0.32s ease-in-out;
}
</style>
