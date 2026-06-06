<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Lock, User, Loader2, AlertCircle, Eye, EyeOff, ShieldCheck, BookOpen, Users } from 'lucide-vue-next'

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
const needSignup = ref(false)

const portalConfig: Record<PortalKey, {
  title: string;
  label: string;
  emoji: string;
  accentText: string;
  accentLine: string;
  button: string;
  shadow: string;
  gateway: string;
  icon: any;
  gradient: string;
}> = {
  admin: {
    title: 'Admin',
    label: 'Administrator',
    emoji: '🛡️',
    accentText: 'text-purple-400',
    accentLine: 'from-purple-500 to-pink-500',
    button: 'neon-btn',
    shadow: 'shadow-purple-500/30',
    gateway: 'Administrative Control Center',
    icon: ShieldCheck,
    gradient: 'from-purple-500 to-pink-500'
  },
  teacher: {
    title: 'Teacher',
    label: 'Educator',
    emoji: '📚',
    accentText: 'text-blue-400',
    accentLine: 'from-blue-500 to-cyan-500',
    button: 'neon-btn neon-btn-cyan',
    shadow: 'shadow-blue-500/30',
    gateway: 'Educator Portal',
    icon: BookOpen,
    gradient: 'from-blue-500 to-cyan-500'
  },
  parent: {
    title: 'Parent',
    label: 'Guardian',
    emoji: '👨‍👩‍👧',
    accentText: 'text-cyan-400',
    accentLine: 'from-cyan-500 to-green-500',
    button: 'neon-btn neon-btn-purple',
    shadow: 'shadow-cyan-500/30',
    gateway: 'Parent Access Gateway',
    icon: Users,
    gradient: 'from-cyan-500 to-green-500'
  }
}

const portalTitle = computed(() => portalConfig[portal.value].title)
const portalButtonClass = computed(() => portalConfig[portal.value].button)
const portalEmoji = computed(() => portalConfig[portal.value].emoji)
const portalShadowClass = computed(() => portalConfig[portal.value].shadow)
const portalGateway = computed(() => portalConfig[portal.value].gateway)
const portalIcon = computed(() => portalConfig[portal.value].icon)
const portalGradient = computed(() => portalConfig[portal.value].gradient)

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
    if (serverCode === 'NEED_SIGNUP') {
      needSignup.value = true
    } else {
      needSignup.value = false
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-root relative min-h-screen overflow-hidden">
    <!-- Background Effects -->
    <div class="neon-bg-orb" style="width: 400px; height: 400px; background: var(--neon-purple); top: -100px; right: -100px;" aria-hidden="true"></div>
    <div class="neon-bg-orb" style="width: 350px; height: 350px; background: var(--neon-blue); bottom: -100px; left: -100px; animation-delay: -8s;" aria-hidden="true"></div>
    <div class="grid-pattern" aria-hidden="true"></div>

    <!-- Top Neon Line -->
    <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 opacity-80" aria-hidden="true"></div>

    <div class="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-12 lg:px-8">
      
      <!-- Portal Selector -->
      <div class="mb-8 flex gap-3">
        <button
          v-for="option in portalOptions"
          :key="option"
          @click="selectPortal(option)"
          class="flex items-center gap-2 rounded-full border px-6 py-3 transition-all"
          :class="[
            portal === option
              ? 'border-purple-500/50 bg-purple-500/20 text-white shadow-lg shadow-purple-500/30'
              : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600 hover:bg-gray-800/70'
          ]"
        >
          <component :is="portalConfig[option].icon" class="h-4 w-4" />
          <span class="text-sm font-medium">{{ portalConfig[option].title }}</span>
        </button>
      </div>

      <!-- Login Card -->
      <div class="w-full max-w-md">
        <div class="glass-card glass-card-purple p-8">
          <!-- Header -->
          <div class="mb-8 text-center">
            <div 
              class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br shadow-lg"
              :class="[portalGradient, portalShadowClass]"
            >
              <component :is="portalIcon" class="h-10 w-10 text-white" />
            </div>
            <h1 class="neon-heading mb-2 text-3xl text-white">
              {{ portalTitle }} Portal {{ portalEmoji }}
            </h1>
            <p class="text-sm text-gray-400">{{ portalGateway }}</p>
          </div>

          <!-- Error Message -->
          <div
            v-if="error"
            class="mb-6 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          >
            <AlertCircle class="h-4 w-4" />
            {{ error }}
          </div>

          <div v-if="needSignup && portal === 'teacher'" class="mb-4 text-sm text-amber-200 bg-amber-900/10 border border-amber-700/20 rounded p-3">
            It looks like your account needs initial setup. <router-link to="/register/teacher" class="underline text-amber-100">Complete registration</router-link>
          </div>

          <!-- Login Form -->
          <form @submit.prevent="handleLogin" class="space-y-6">
            <!-- Username / Email -->
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-300">
                {{ portal === 'teacher' ? 'Email Address' : 'Email or Username' }}
              </label>
              <div class="relative">
                <User class="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  v-model="username"
                  :type="portal === 'teacher' ? 'email' : 'text'"
                  required
                  class="modern-input pl-12"
                  :placeholder="portal === 'teacher' ? 'Enter your email address' : 'Enter your email or username'"
                />
              </div>
            </div>

            <!-- Password -->
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-300">
                Password
              </label>
              <div class="relative">
                <Lock class="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  v-model="password"
                  :type="passwordVisible ? 'text' : 'password'"
                  required
                  class="modern-input pl-12 pr-12"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  @click="passwordVisible = !passwordVisible"
                  class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  <Eye v-if="!passwordVisible" class="h-5 w-5" />
                  <EyeOff v-else class="h-5 w-5" />
                </button>
              </div>
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              :disabled="loading"
              class="w-full"
              :class="portalButtonClass"
            >
              <Loader2 v-if="loading" class="h-5 w-5 animate-spin" />
              <span v-else>Sign In</span>
            </button>
          </form>

          <!-- Footer -->
          <div class="mt-6 text-center space-y-3">
            <a href="/forgot-password" class="text-sm text-gray-400 hover:text-purple-400 transition-colors">
              Forgot your password?
            </a>
            <div v-if="portal === 'teacher'" class="text-sm">
              <router-link to="/register/teacher" class="text-cyan-300 hover:text-cyan-100 transition-colors">
                Don't have an account? Sign up
              </router-link>
            </div>
          </div>
        </div>

        <!-- Back to Home -->
        <div class="mt-6 text-center">
          <router-link to="/" class="text-sm text-gray-400 hover:text-purple-400 transition-colors">
            ← Back to Home
          </router-link>
        </div>
      </div>
    </div>

    <!-- Bottom Neon Line -->
    <div class="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 opacity-80" aria-hidden="true"></div>
  </div>
</template>

<style scoped>
.login-root {
  background: var(--bg-primary);
  background-image: 
    linear-gradient(135deg, rgba(10, 14, 39, 0.93), rgba(17, 22, 56, 0.96)),
    url('https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1920&q=80');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
}
</style>
