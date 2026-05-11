<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Menu, X, Settings, LogOut, Sun, Moon } from 'lucide-vue-next'

const props = defineProps<{
  portal: 'Admin' | 'Teacher' | 'Parent'
  username?: string
}>()

const router = useRouter()
const mobileMenuOpen = ref(false)
const isDark = ref(document.documentElement.classList.contains('dark'))

const toggleTheme = () => {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark')
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const handleLogout = () => {
  // Logic for logout
  router.push('/')
}
</script>

<template>
  <header class="no-print purple-gradient py-4 shadow-2xl shadow-purple-900/20 relative overflow-hidden sticky top-0 z-50">
    <div class="absolute inset-0 opacity-10 pointer-events-none">
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs><pattern id="academic" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M0 20 L20 0 L40 20 L20 40 Z" fill="none" stroke="white" stroke-width="0.5"/></pattern></defs>
        <rect width="100%" height="100%" fill="url(#academic)" />
      </svg>
    </div>
    
    <div class="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 relative z-10">
      <router-link to="/" class="flex items-center gap-3 transition hover:scale-105 active:scale-95">
        <div class="rounded-xl bg-white p-1.5 shadow-xl border border-white/30">
          <img src="/logo.png" alt="Logo" class="h-10 w-10 object-contain" />
        </div>
        <div class="hidden sm:block text-lg font-black tracking-widest text-white uppercase">
          FOLUSHO <span class="text-royal-gold">VICTORY</span>
        </div>
      </router-link>

      <div class="flex items-center gap-2 sm:gap-4">
        <!-- User Info -->
        <div v-if="username" class="hidden lg:flex flex-col items-end mr-2">
          <span class="text-[10px] font-black uppercase tracking-widest text-purple-200">{{ portal }}</span>
          <span class="text-xs font-bold text-white">{{ username }}</span>
        </div>

        <button @click="toggleTheme" class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20 active:scale-95 border border-white/20">
          <Sun v-if="isDark" class="h-5 w-5" />
          <Moon v-else class="h-5 w-5" />
        </button>

        <button class="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20 active:scale-95 border border-white/20">
          <Settings class="h-5 w-5" />
        </button>

        <button @click="handleLogout" class="hidden sm:flex items-center gap-2 rounded-xl bg-royal-gold px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-900 shadow-lg shadow-amber-900/20 transition hover:bg-amber-400 active:scale-95">
          <LogOut class="h-4 w-4" />
          <span class="hidden md:inline">Logout</span>
        </button>

        <button @click="toggleMobileMenu" class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20 sm:hidden border border-white/20">
          <Menu v-if="!mobileMenuOpen" class="h-6 w-6" />
          <X v-else class="h-6 w-6" />
        </button>
      </div>
    </div>

    <!-- Mobile Menu -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div v-if="mobileMenuOpen" class="sm:hidden bg-royal-purple/95 backdrop-blur-lg border-t border-white/10 p-4 space-y-3">
        <div class="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
          <div class="flex flex-col">
            <span class="text-[10px] font-black uppercase tracking-widest text-purple-200">{{ portal }}</span>
            <span class="text-sm font-bold text-white">{{ username || 'Guest' }}</span>
          </div>
        </div>
        <router-link to="/settings" class="flex items-center gap-3 p-4 rounded-xl text-white font-bold hover:bg-white/10">
          <Settings class="w-5 h-5" /> Settings
        </router-link>
        <button @click="handleLogout" class="w-full flex items-center gap-3 p-4 rounded-xl text-royal-gold font-bold hover:bg-white/10">
          <LogOut class="w-5 h-5" /> Logout
        </button>
      </div>
    </transition>
  </header>
</template>
