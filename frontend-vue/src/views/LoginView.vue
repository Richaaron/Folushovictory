<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Lock, User, Loader2, AlertCircle } from 'lucide-vue-next'

import api from '../services/api'
import { useAuthStore } from '../stores/authStore'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const portal = ref(String(route.params.portal || 'admin').toLowerCase())
const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const portalTitle = computed(() => {
  switch (portal.value) {
    case 'admin': return 'Administrator'
    case 'teacher': return 'Academic Staff'
    case 'parent': return 'Parent/Guardian'
    default: return 'Portal'
  }
})

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
  <div class="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12">
    <div class="max-w-md w-full space-y-8 fade-in">
      <div class="text-center">
        <div class="mx-auto h-20 w-20 bg-white dark:bg-slate-900 rounded-2xl p-3 shadow-xl border border-purple-50 dark:border-purple-900/30 flex items-center justify-center mb-6">
          <img src="/fvs_v2_final.png" alt="Logo" class="object-contain w-full h-full" />
        </div>
        <h2 class="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          {{ portalTitle }} <span class="text-royal-purple">Login</span>
        </h2>
        <p class="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          Folusho Victory Schools Digital Access
        </p>
      </div>

      <div class="academic-card rounded-3xl p-8 shadow-2xl">
        <form @submit.prevent="handleLogin" class="space-y-6">
          <div v-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle class="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p class="text-sm font-bold text-red-700 dark:text-red-400">{{ error }}</p>
          </div>

          <div class="space-y-1">
            <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Username / ID</label>
            <div class="relative group">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-royal-purple transition-colors">
                <User class="h-5 w-5" />
              </div>
              <input 
                v-model="username"
                type="text" 
                required
                class="block w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-royal-purple transition-all outline-none"
                placeholder="Enter your credentials"
              />
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Secret Password</label>
            <div class="relative group">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-royal-purple transition-colors">
                <Lock class="h-5 w-5" />
              </div>
              <input 
                v-model="password"
                type="password" 
                required
                class="block w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-royal-purple transition-all outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit"
            :disabled="loading"
            class="w-full flex items-center justify-center rounded-2xl purple-gradient px-8 py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-purple-200 dark:shadow-purple-900/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            <Loader2 v-if="loading" class="w-5 h-5 animate-spin mr-3" />
            <span v-else>Authorize Access</span>
          </button>
        </form>

        <div class="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div class="flex items-center justify-between text-xs font-black uppercase tracking-widest text-slate-400">
            <span>Change Portal:</span>
            <div class="flex gap-4">
              <button @click="portal = 'admin'" :class="{'text-royal-purple': portal === 'admin'}" class="hover:text-royal-purple transition-colors">Admin</button>
              <button @click="portal = 'teacher'" :class="{'text-royal-purple': portal === 'teacher'}" class="hover:text-royal-purple transition-colors">Teacher</button>
              <button @click="portal = 'parent'" :class="{'text-royal-purple': portal === 'parent'}" class="hover:text-royal-purple transition-colors">Parent</button>
            </div>
          </div>
        </div>
      </div>
      
      <p class="text-center text-xs font-medium text-slate-400 tracking-wide">
        &copy; 2026 Folusho Victory Schools. Secure Academic Gateway.
      </p>
    </div>
  </div>
</template>
