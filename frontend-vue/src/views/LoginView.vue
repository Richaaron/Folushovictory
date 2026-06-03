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
    button: 'bg-gradient-to-r from-royal-purple via-royal-purple to-royal-gold',
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
  <div class="login-root relative min-h-screen overflow-hidden bg-slate-950 text-white">
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(88,28,135,0.24),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(212,175,55,0.16),transparent_30%)] pointer-events-none"></div>
    <div class="absolute -left-16 top-16 h-72 w-72 rounded-full bg-royal-purple/10 blur-3xl"></div>
    <div class="absolute right-0 bottom-20 h-64 w-64 rounded-full bg-royal-gold/10 blur-3xl"></div>

    <div class="relative mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-12 lg:px-8 lg:py-16">
      <div class="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <section class="animate-card-in rounded-[2rem] border border-royal-gold/20 bg-slate-950/85 p-10 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl ring-1 ring-royal-gold/10 h-full flex flex-col justify-between">
          <div>
            <div class="hero-badge">Institutional Control</div>
            <div class="space-y-5 pt-4">
              <h1 class="text-4xl font-black tracking-tight text-white sm:text-5xl">Secure gateway for school leadership, staff, and parent access.</h1>
            <p class="max-w-2xl text-base leading-8 text-slate-300">Redesigned with strong contrast, crisp spacing, and a modern academic system architecture that makes login simple and authoritative.</p>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <article class="info-pill animate-card-in delay-150">
              <p class="text-[10px] uppercase tracking-[0.26em] text-slate-400">Trusted access</p>
              <p class="mt-3 font-black text-white">Secure credentials and guardrail workflows.</p>
            </article>
            <article class="info-pill animate-card-in delay-250">
              <p class="text-[10px] uppercase tracking-[0.26em] text-slate-400">Streamlined sign-in</p>
              <p class="mt-3 font-black text-white">A cleaner interface with compact form focus.</p>
            </article>
          </div>
          </div>
        </section>

        <section class="relative animate-card-in delay-150 rounded-[2rem] border border-royal-purple/15 bg-slate-900/95 p-10 shadow-[0_40px_110px_rgba(88,28,135,0.24)] backdrop-blur-xl ring-1 ring-slate-800/80 overflow-hidden">
          <div class="pointer-events-none absolute right-0 top-0 h-36 w-36 rounded-full bg-gradient-to-br from-royal-purple/30 to-royal-gold/10 blur-3xl animate-blob"></div>
          <div class="space-y-8 relative z-10">
            <div class="space-y-4 text-center">
              <div class="hero-badge glow">Secure Gateway</div>
              <h2 class="text-3xl font-black tracking-tight text-white">{{ portalTitle }} <span class="ml-2">{{ portalEmoji }}</span></h2>
              <p class="text-sm uppercase tracking-[0.2em] text-slate-400">Institutional control & academic management</p>
            </div>

            <form @submit.prevent="handleLogin" class="space-y-6" novalidate>
              <div class="form-card">
                <div class="grid gap-4">
                  <div class="space-y-2">
                    <div class="flex items-center justify-between gap-4">
                      <span class="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">{{ usernameLabel }}</span>
                      <span class="text-[10px] uppercase tracking-[0.28em] text-slate-500">Use your secure ID</span>
                    </div>
                    <div class="relative rounded-[1.5rem] border border-slate-700/60 bg-slate-900/80 px-4 py-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)] transition duration-300 focus-within:border-royal-gold/30 focus-within:ring-1 focus-within:ring-royal-gold/20">
                      <div class="absolute inset-y-0 left-4 flex items-center text-royal-gold">
                        <User class="h-5 w-5" aria-hidden="true" />
                      </div>
                      <input
                        id="username"
                        v-model="username"
                        type="text"
                        required
                        autocomplete="username"
                        class="field-input"
                        :placeholder="usernamePlaceholder"
                        :aria-invalid="!!error"
                      />
                    </div>
                  </div>

                  <div class="space-y-2">
                    <div class="flex items-center justify-between gap-4">
                      <span class="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">{{ passwordLabel }}</span>
                      <span class="text-[10px] uppercase tracking-[0.28em] text-slate-500">Protected access</span>
                    </div>
                    <div class="relative rounded-[1.5rem] border border-slate-700/60 bg-slate-900/80 px-4 py-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)] transition duration-300 focus-within:border-royal-gold/30 focus-within:ring-1 focus-within:ring-royal-gold/20">
                      <div class="absolute inset-y-0 left-4 flex items-center text-royal-gold">
                        <Lock class="h-5 w-5" aria-hidden="true" />
                      </div>
                      <input
                        id="password"
                        v-model="password"
                        :type="passwordVisible ? 'text' : 'password'"
                        required
                        autocomplete="current-password"
                        class="field-input pr-12"
                        :placeholder="passwordPlaceholder"
                        :aria-invalid="!!error"
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

                  <div v-if="error" class="rounded-[1.5rem] border border-rose-600/20 bg-rose-500/10 p-4 text-sm text-rose-100 shadow-[0_20px_60px_rgba(245,115,115,0.15)] animate-shake" role="alert">
                    <div class="flex items-center gap-3">
                      <AlertCircle class="h-5 w-5 text-rose-300" aria-hidden="true" />
                      <p class="font-semibold">{{ error }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="submit"
                  :disabled="loading"
                  :class="[portalButtonClass, 'action-button', portalShadowClass]"
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

            <div class="rounded-[1.75rem] border border-slate-800/80 bg-slate-900/90 px-5 py-5">
              <p class="text-[9px] font-black uppercase tracking-[0.28em] text-slate-500 text-center mb-3">Switch Operational Portal</p>
              <div class="flex flex-wrap justify-center gap-3">
                <button
                  v-for="p in portalOptions"
                  :key="p"
                  @click="selectPortal(p)"
                  :aria-pressed="portal === p"
                  :class="portal === p ? 'portal-switch-button active' : 'portal-switch-button'"
                  type="button"
                >
                  <span>{{ portalConfig[p].emoji }}</span>
                  <span>{{ portalConfig[p].label }}</span>
                </button>
              </div>
            </div>

            <div class="rounded-[1.75rem] border border-slate-800/80 bg-slate-900/90 px-6 py-5 text-center text-slate-500">
              <p class="text-[10px] uppercase tracking-[0.2em]">© 2026 Folusho Victory Schools. Unified Academic Engine.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.info-pill {
  @apply rounded-[1.75rem] border border-slate-700/60 bg-slate-900/85 p-6 shadow-[0_24px_65px_rgba(0,0,0,0.20)];
}

.hero-badge {
  @apply inline-flex rounded-full border border-royal-gold/20 bg-slate-950/90 px-4 py-2 text-sm font-black uppercase tracking-[0.35em] text-royal-gold shadow-[0_18px_40px_rgba(212,175,55,0.18)];
}

.hero-badge.glow {
  animation: pulse-glow 4s ease-in-out infinite;
}

.portal-switch-button {
  @apply inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/80 px-5 py-3 text-[10px] font-black uppercase tracking-[0.25em] text-slate-300 transition duration-300 hover:bg-slate-800 hover:text-white hover:scale-105;
}

.portal-switch-button.active {
  @apply bg-gradient-to-r from-royal-purple to-royal-gold text-white shadow-[0_20px_50px_rgba(88,28,135,0.24)] border-transparent;
}

.action-button {
  @apply w-full sm:w-auto flex items-center justify-center rounded-[1.5rem] px-6 py-4 text-sm font-black uppercase tracking-[0.2em] text-white transition duration-300 ease-out transform focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal-gold/30;
}

.action-button:hover {
  transform: translateY(-2px);
}

.action-button:active {
  transform: translateY(0) scale(0.98);
}

.form-card {
  @apply rounded-[1.75rem] border border-slate-800/70 bg-slate-950/85 p-6 shadow-[0_18px_45px_rgba(0,0,0,0.22)] transition duration-300;
}

.form-card:hover {
  @apply border-royal-gold/30;
}

.field-input {
  @apply w-full bg-transparent pl-14 pr-4 text-sm text-white placeholder-slate-500 outline-none transition duration-300;
}

.field-input:focus {
  @apply placeholder-slate-400;
}

.animate-card-in {
  opacity: 0;
  animation: fadeInUp 0.65s ease forwards;
}

.animate-card-in.delay-150 {
  animation-delay: 0.15s;
}

.animate-card-in.delay-250 {
  animation-delay: 0.25s;
}

.animate-card-in.delay-350 {
  animation-delay: 0.35s;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(18px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(212,175,55,0.18);
  }
  50% {
    box-shadow: 0 0 0 18px rgba(212,175,55,0.04);
  }
}

@keyframes blob {
  0%, 100% {
    transform: translate(0,0) scale(1);
  }
  33% {
    transform: translate(12px,-8px) scale(1.05);
  }
  66% {
    transform: translate(-8px,12px) scale(0.96);
  }
}

.animate-blob {
  animation: blob 9s ease-in-out infinite;
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

/* Academic Background Image for Login Page */
.login-root {
  background-image: 
    linear-gradient(135deg, rgba(15, 23, 42, 0.85), rgba(30, 27, 75, 0.88)),
    url('https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=1920&q=80');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
}

/* Enhanced form card animations */
.form-card {
  position: relative;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.form-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.05), transparent);
  opacity: 0;
  transition: opacity 0.4s ease;
}

.form-card:hover::before {
  opacity: 1;
}

/* Field input modern styling */
.field-input {
  width: 100%;
  background: transparent;
  border: none;
  color: white;
  padding-left: 2.5rem;
  font-size: 0.95rem;
}

.field-input:focus {
  outline: none;
}

.field-input::placeholder {
  color: rgba(148, 163, 184, 0.5);
}

/* Portal selector enhanced */
.portal-selector {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.portal-selector:hover {
  transform: scale(1.05);
}

/* Button glow effect */
@keyframes button-glow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(99, 102, 241, 0.5);
  }
}

/* Card entrance animation */
@keyframes card-entrance {
  0% {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.animate-card-in {
  animation: card-entrance 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.delay-150 {
  animation-delay: 0.15s;
  opacity: 0;
}

.delay-250 {
  animation-delay: 0.25s;
  opacity: 0;
}
</style>
