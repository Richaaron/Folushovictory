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
  <header class="no-print glass-nav mx-4 mt-4 rounded-3xl py-4 shadow-2xl shadow-nebula-500/10 border border-white/20 dark:border-slate-800/30 overflow-hidden">
    <!-- Subtle Background Glow -->
    <div class="absolute -top-10 -left-10 w-40 h-40 bg-nebula-500/20 blur-[100px] pointer-events-none"></div>
    <div class="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-500/20 blur-[100px] pointer-events-none"></div>
    
    <div class="mx-auto flex max-w-7xl items-center justify-between px-6 relative z-10">
      <router-link to="/" class="flex items-center gap-3 transition hover:scale-105 active:scale-95 group">
        <div class="relative">
          <div class="absolute inset-0 bg-nebula-500 blur-xl opacity-0 group-hover:opacity-40 transition-opacity"></div>
          <div class="relative rounded-2xl bg-white dark:bg-slate-900 p-2 shadow-2xl border border-slate-200 dark:border-slate-700">
            <img src="/logo.png" alt="Logo" class="h-10 w-10 object-contain" />
          </div>
        </div>
        <div class="hidden sm:block">
          <div class="text-xs font-black tracking-[0.2em] text-nebula-600 dark:text-nebula-400 uppercase leading-none mb-1">Academy Portal</div>
          <div class="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none">
            FOLUSHO <span class="text-transparent bg-clip-text nebula-gradient">VICTORY</span>
          </div>
        </div>
      </router-link>

      <div class="flex items-center gap-3">
        <!-- User Info -->
        <div v-if="username" class="hidden lg:flex flex-col items-end px-4 py-2 rounded-2xl bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
          <span class="text-[9px] font-black uppercase tracking-[0.2em] text-nebula-500">{{ portal }}</span>
          <span class="text-xs font-extrabold text-slate-700 dark:text-slate-200">{{ username }}</span>
        </div>

        <div class="flex items-center bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
          <button @click="toggleTheme" class="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 transition hover:bg-white dark:hover:bg-slate-700 hover:text-nebula-500 dark:hover:text-nebula-400 active:scale-95">
            <Sun v-if="isDark" class="h-5 w-5" />
            <Moon v-else class="h-5 w-5" />
          </button>

          <button class="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 transition hover:bg-white dark:hover:bg-slate-700 hover:text-nebula-500 dark:hover:text-nebula-400 active:scale-95">
            <Settings class="h-5 w-5" />
          </button>
        </div>

        <button @click="handleLogout" class="hidden sm:flex items-center gap-2 rounded-2xl nebula-gradient px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-nebula-500/20 transition hover:scale-105 hover:shadow-nebula-500/30 active:scale-95">
          <LogOut class="h-4 w-4" />
          <span class="hidden md:inline">Sign Out</span>
        </button>

        <button @click="toggleMobileMenu" class="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100/50 dark:bg-slate-800/50 text-slate-900 dark:text-white transition hover:bg-slate-200 dark:hover:bg-slate-700 sm:hidden border border-slate-200 dark:border-slate-700">
          <Menu v-if="!mobileMenuOpen" class="h-6 w-6" />
          <X v-else class="h-6 w-6" />
        </button>
      </div>
    </div>

    <!-- Mobile Menu -->
    <transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 -translate-y-4 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 -translate-y-4 scale-95"
    >
      <div v-if="mobileMenuOpen" class="sm:hidden absolute top-full left-0 right-0 mt-2 mx-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[2rem] border border-white/20 dark:border-slate-800/50 shadow-2xl p-6 space-y-4 z-50">
        <div class="flex items-center gap-4 p-4 rounded-2xl bg-slate-100 dark:bg-slate-800">
          <div class="h-12 w-12 rounded-xl bg-nebula-500 flex items-center justify-center text-white font-black text-xl">
            {{ username?.charAt(0) || 'U' }}
          </div>
          <div class="flex flex-col">
            <span class="text-[10px] font-black uppercase tracking-widest text-nebula-500">{{ portal }}</span>
            <span class="text-base font-black text-slate-900 dark:text-white">{{ username || 'Guest' }}</span>
          </div>
        </div>
        <div class="grid grid-cols-1 gap-2">
          <router-link to="/settings" class="flex items-center gap-3 p-4 rounded-2xl text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Settings class="w-5 h-5 text-nebula-500" /> Settings
          </router-link>
          <button @click="handleLogout" class="w-full flex items-center gap-3 p-4 rounded-2xl text-rose-500 font-bold hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
            <LogOut class="w-5 h-5" /> Logout
          </button>
        </div>
      </div>
    </transition>
  </header>
</template>
