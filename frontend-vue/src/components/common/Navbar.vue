<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Menu, X, Settings, LogOut, Sun, Moon } from 'lucide-vue-next'

const props = defineProps<{
  portal: 'Admin' | 'Teacher' | 'Parent'
  username?: string
  menuItems?: Array<{ name: string, icon: any, route: string }>
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
  mobileMenuOpen.value = false
  router.push('/')
}

// Close mobile menu on escape key
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && mobileMenuOpen.value) {
    mobileMenuOpen.value = false
  }
}

// Watch for mobile menu changes and add/remove keydown listener
watch(mobileMenuOpen, (newVal) => {
  if (newVal) {
    document.addEventListener('keydown', handleKeyDown)
  } else {
    document.removeEventListener('keydown', handleKeyDown)
  }
const settingsPath = computed(() => {
  return `/${props.portal.toLowerCase()}/settings`
})
</script>

<template>
  <header class="no-print glass-nav mx-2 sm:mx-4 mt-2 sm:mt-4 rounded-2xl sm:rounded-3xl py-3 sm:py-4 shadow-2xl shadow-nebula-500/10 border border-white/20 dark:border-slate-800/30 overflow-hidden relative">
    <!-- Subtle Background Glow -->
    <div class="absolute -top-10 -left-10 w-40 h-40 bg-nebula-500/20 blur-[100px] pointer-events-none" aria-hidden="true"></div>
    <div class="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-500/20 blur-[100px] pointer-events-none" aria-hidden="true"></div>
    
    <div class="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6 relative z-10 min-h-[56px]">
      <router-link to="/" class="flex items-center gap-2 sm:gap-3 transition hover:scale-105 active:scale-95 group focus-visible:ring-4 focus-visible:ring-nebula-500/40 rounded-lg" aria-label="Home">
        <div class="relative">
          <div class="absolute inset-0 bg-nebula-500 blur-xl opacity-0 group-hover:opacity-40 transition-opacity" aria-hidden="true"></div>
          <div class="relative rounded-lg sm:rounded-2xl bg-white dark:bg-slate-900 p-2 shadow-2xl border border-slate-200 dark:border-slate-700">
            <img src="/logo.png" alt="Folusho Victory Schools Logo" class="h-8 sm:h-10 w-8 sm:w-10 object-contain" />
          </div>
        </div>
        <div class="hidden sm:block">
          <div class="text-[8px] sm:text-xs font-black tracking-[0.2em] text-nebula-600 dark:text-nebula-400 uppercase leading-none mb-1">Academy Portal</div>
          <div class="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none">
            <span class="hidden md:inline">FOLUSHO <span class="text-transparent bg-clip-text nebula-gradient">VICTORY</span></span>
            <span class="md:hidden">FVS</span>
          </div>
        </div>
      </router-link>

      <div class="flex items-center gap-2 sm:gap-3">
        <!-- User Info - Hidden on small screens -->
        <div v-if="username" class="hidden lg:flex flex-col items-end px-3 sm:px-4 py-2 rounded-lg sm:rounded-2xl bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
          <span class="text-[8px] font-black uppercase tracking-[0.2em] text-nebula-500">{{ portal }}</span>
          <span class="text-[10px] sm:text-xs font-extrabold text-slate-700 dark:text-slate-200 truncate">{{ username }}</span>
        </div>

        <div class="flex items-center bg-slate-100/50 dark:bg-slate-800/50 p-1 sm:p-1.5 rounded-lg sm:rounded-2xl border border-slate-200/50 dark:border-slate-700/50 gap-1">
          <button 
            @click="toggleTheme" 
            class="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 transition hover:bg-white dark:hover:bg-slate-700 hover:text-nebula-500 dark:hover:text-nebula-400 active:scale-95 focus-visible:ring-4 focus-visible:ring-nebula-500/40"
            :aria-label="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
            type="button"
          >
            <Sun v-if="isDark" class="h-5 w-5" aria-hidden="true" />
            <Moon v-else class="h-5 w-5" aria-hidden="true" />
          </button>

          <router-link 
            :to="settingsPath"
            class="hidden sm:flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 transition hover:bg-white dark:hover:bg-slate-700 hover:text-nebula-500 dark:hover:text-nebula-400 active:scale-95 focus-visible:ring-4 focus-visible:ring-nebula-500/40"
            aria-label="System Settings"
          >
            <Settings class="h-5 w-5" aria-hidden="true" />
          </router-link>
        </div>

        <button 
          @click="handleLogout" 
          class="hidden sm:flex items-center gap-2 rounded-lg sm:rounded-2xl nebula-gradient px-3 sm:px-5 py-2 sm:py-2.5 text-[10px] sm:text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-nebula-500/20 transition hover:scale-105 hover:shadow-nebula-500/30 active:scale-95 focus-visible:ring-4 focus-visible:ring-nebula-500/40 min-h-[44px]"
          aria-label="Sign Out"
          type="button"
        >
          <LogOut class="h-4 w-4" aria-hidden="true" />
          <span class="hidden md:inline">Sign Out</span>
        </button>

        <button 
          @click="toggleMobileMenu" 
          class="flex h-12 w-12 items-center justify-center rounded-lg sm:rounded-2xl bg-slate-100/50 dark:bg-slate-800/50 text-slate-900 dark:text-white transition hover:bg-slate-200 dark:hover:bg-slate-700 sm:hidden border border-slate-200 dark:border-slate-700 focus-visible:ring-4 focus-visible:ring-nebula-500/40"
          :aria-expanded="mobileMenuOpen"
          aria-controls="mobile-menu"
          :aria-label="mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'"
          type="button"
        >
          <Menu v-if="!mobileMenuOpen" class="h-6 w-6" aria-hidden="true" />
          <X v-else class="h-6 w-6" aria-hidden="true" />
        </button>
      </div>
    </div>

    <!-- Mobile Menu -->
    <transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 -translate-y-2 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 -translate-y-2 scale-95"
    >
      <div 
        v-if="mobileMenuOpen" 
        id="mobile-menu"
        role="navigation"
        aria-label="Mobile Navigation"
        class="sm:hidden absolute top-full left-2 right-2 mt-2 bg-white/98 dark:bg-slate-900/98 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/30 dark:border-slate-800/50 shadow-2xl p-4 sm:p-6 space-y-4 z-50 overflow-y-auto max-h-[calc(100vh-120px)]"
      >
        <!-- Mobile User Profile Section -->
        <div v-if="username" class="flex items-center gap-3 p-3 rounded-lg bg-slate-100 dark:bg-slate-800/50 mb-4">
          <div class="h-10 w-10 rounded-lg bg-nebula-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-nebula-500/20 flex-shrink-0">
            {{ username?.charAt(0) || 'U' }}
          </div>
          <div class="flex flex-col min-w-0">
            <span class="text-[9px] font-black uppercase tracking-widest text-nebula-500">{{ portal }}</span>
            <span class="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">{{ username || 'Guest' }}</span>
          </div>
        </div>

        <!-- Mobile Navigation Menu -->
        <nav class="grid grid-cols-1 gap-2" role="menubar">
          <!-- Dynamic Menu Items -->
          <router-link 
            v-for="item in menuItems" 
            :key="item.name"
            :to="item.route"
            @click="mobileMenuOpen = false"
            role="menuitem"
            class="flex items-center gap-3 p-3 rounded-lg text-slate-600 dark:text-slate-300 font-bold hover:bg-nebula-500/10 hover:text-nebula-500 focus-visible:ring-4 focus-visible:ring-nebula-500/40 transition-all border border-transparent hover:border-nebula-500/10 active:scale-95"
          >
            <component :is="item.icon" class="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            <span class="uppercase tracking-widest text-[11px] font-black">{{ item.name }}</span>
          </router-link>

          <div class="h-px bg-slate-200 dark:bg-slate-700 my-1" aria-hidden="true"></div>

          <!-- Settings Link -->
          <router-link 
            to="/admin/settings" 
            @click="mobileMenuOpen = false"
            role="menuitem"
            class="flex items-center gap-3 p-3 rounded-lg text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800/50 focus-visible:ring-4 focus-visible:ring-nebula-500/40 transition-colors active:scale-95"
          >
            <Settings class="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            <span class="uppercase tracking-widest text-[11px] font-black">Settings</span>
          </router-link>
          
          <!-- Sign Out Button for Mobile -->
          <button 
            @click="handleLogout"
            type="button"
            role="menuitem"
            class="w-full flex items-center gap-3 p-3 rounded-lg text-rose-500 font-bold hover:bg-rose-50 dark:hover:bg-rose-900/20 focus-visible:ring-4 focus-visible:ring-rose-500/40 transition-colors active:scale-95 min-h-[44px]"
          >
            <LogOut class="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            <span class="uppercase tracking-widest text-[11px] font-black">Sign Out</span>
          </button>
        </nav>
      </div>
    </transition>
  </header>
</template>
