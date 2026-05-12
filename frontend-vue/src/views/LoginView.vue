<script setup lang="ts">
import { ref, computed } from 'vue'
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
  <div class="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#020617] px-4 py-12 relative overflow-hidden">
    <!-- Dynamic Background Elements -->
    <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-nebula-500/20 blur-[120px] rounded-full animate-pulse-slow"></div>
    <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 blur-[120px] rounded-full animate-pulse-slow" style="animation-delay: 2s"></div>
    <div class="absolute top-[20%] right-[10%] w-[20%] h-[20%] bg-emerald-500/10 blur-[80px] rounded-full animate-float"></div>

    <div class="max-w-md w-full space-y-10 fade-in relative z-10">
      <div class="text-center">
        <div class="relative inline-block group">
          <div class="absolute inset-0 bg-nebula-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
          <div class="relative mx-auto h-24 w-24 bg-white dark:bg-slate-900 rounded-[2rem] p-4 shadow-2xl border border-white/50 dark:border-slate-700 flex items-center justify-center mb-8 transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
            <img src="/logo.png" alt="Logo" class="object-contain w-full h-full" />
          </div>
        </div>
        
        <div class="space-y-2">
          <div class="flex items-center justify-center gap-3">
            <div class="h-px w-8 bg-nebula-500/30"></div>
            <span class="text-[10px] font-black uppercase tracking-[0.4em] text-nebula-500">Secure Gateway</span>
            <div class="h-px w-8 bg-nebula-500/30"></div>
          </div>
          <h2 class="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
            {{ portalTitle }} <span class="text-transparent bg-clip-text nebula-gradient">Login</span>
          </h2>
          <p class="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em]">
            Institutional Control & Academic Management
          </p>
        </div>
      </div>

      <div class="glass-card rounded-[3rem] p-10 shadow-2xl border border-white/40 dark:border-slate-800/50">
        <form @submit.prevent="handleLogin" class="space-y-8">
          <div v-if="error" class="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl p-4 flex items-start gap-3 animate-shake">
            <AlertCircle class="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <p class="text-xs font-bold text-rose-700 dark:text-rose-400 leading-snug">{{ error }}</p>
          </div>

          <div class="space-y-2">
            <label class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Access Identifier</label>
            <div class="relative group">
              <div class="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-nebula-500 transition-colors duration-300">
                <User class="h-5 w-5" />
              </div>
              <input 
                v-model="username"
                type="text" 
                required
                class="block w-full pl-14 pr-6 py-5 bg-slate-100/50 dark:bg-slate-800/50 border border-transparent rounded-[1.5rem] text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-nebula-500/30 focus:ring-4 focus:ring-nebula-500/10 transition-all outline-none font-bold"
                placeholder="Staff ID or Username"
              />
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Secure Keyphrase</label>
            <div class="relative group">
              <div class="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-nebula-500 transition-colors duration-300">
                <Lock class="h-5 w-5" />
              </div>
              <input 
                v-model="password"
                type="password" 
                required
                class="block w-full pl-14 pr-6 py-5 bg-slate-100/50 dark:bg-slate-800/50 border border-transparent rounded-[1.5rem] text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-nebula-500/30 focus:ring-4 focus:ring-nebula-500/10 transition-all outline-none font-bold"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit"
            :disabled="loading"
            class="w-full flex items-center justify-center rounded-[1.5rem] nebula-gradient px-8 py-5 text-sm font-black uppercase tracking-[0.2em] text-white shadow-2xl shadow-nebula-500/30 hover:scale-[1.02] hover:shadow-nebula-500/40 active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            <Loader2 v-if="loading" class="w-5 h-5 animate-spin mr-3" />
            <span v-else>Authorize Access</span>
          </button>
        </form>

        <div class="mt-10 pt-8 border-t border-slate-200/50 dark:border-slate-800/50">
          <div class="flex flex-col gap-4">
            <span class="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 text-center">Switch Operational Portal</span>
            <div class="flex justify-center gap-3">
              <button 
                v-for="p in ['admin', 'teacher', 'parent']" 
                :key="p"
                @click="portal = p" 
                :class="[portal === p ? 'bg-nebula-500 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700']" 
                class="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300"
              >
                {{ p }}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="text-center space-y-4">
        <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          &copy; 2026 Folusho Victory Schools. Unified Academic Engine.
        </p>
        <div class="flex justify-center gap-6 opacity-30 group">
          <div class="h-1 w-8 bg-nebula-500 rounded-full group-hover:w-12 transition-all"></div>
          <div class="h-1 w-8 bg-purple-500 rounded-full group-hover:w-12 transition-all"></div>
          <div class="h-1 w-8 bg-emerald-500 rounded-full group-hover:w-12 transition-all"></div>
        </div>
      </div>
    </div>
  </div>
</template>
