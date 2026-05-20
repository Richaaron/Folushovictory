<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Menu, X, LogOut, Sun, Moon } from 'lucide-vue-next'

const props = defineProps<{
  portal: 'Admin' | 'Teacher' | 'Parent'
  username?: string
  menuItems?: Array<{ name: string; icon: any; route: string }>
  onToggleSidebar?: () => void
}>()

const router = useRouter()
const mobileMenuOpen = ref(false)
const isDark = ref(document.documentElement.classList.contains('dark'))

const toggleTheme = () => {
  isDark.value = !isDark.value
  if (isDark.value) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
}

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}


const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login/' + props.portal.toLowerCase())
}

// Close mobile menu on route change
watch(() => router.currentRoute.value.path, () => {
  mobileMenuOpen.value = false
})

</script>

<template>
  <header class="no-print glass-nav py-3 px-4 relative">
    <div class="mx-auto flex max-w-7xl items-center justify-between min-h-[56px]">
      <router-link to="/" class="flex items-center gap-3 transition hover:opacity-80">
        <div class="h-10 w-10 bg-white dark:bg-slate-800 rounded-lg p-1.5 border border-slate-200 dark:border-slate-700">
          <img src="/logo.png" alt="Logo" class="h-full w-full object-contain" />
        </div>
        <div class="hidden sm:block">
          <div class="text-[10px] font-bold text-royal-purple dark:text-royal-gold uppercase tracking-wider leading-none mb-1">Academy Portal</div>
          <div class="text-lg font-black text-slate-900 dark:text-white uppercase leading-none">
            FOLUSHO <span class="text-royal-purple dark:text-royal-gold">VICTORY</span>
          </div>
        </div>
      </router-link>

      <div class="flex items-center gap-2 sm:gap-4">
        <!-- Desktop Nav Items could go here if needed -->
        
        <!-- Theme Toggle -->
        <button 
          @click="toggleTheme" 
          class="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          :aria-label="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
        >
          <Sun v-if="isDark" class="w-5 h-5" />
          <Moon v-else class="w-5 h-5" />
        </button>

        <!-- User Menu (Desktop) -->
        <div v-if="username" class="hidden md:flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-800">
          <div class="text-right">
            <p class="text-xs font-bold text-slate-900 dark:text-white leading-none">{{ username }}</p>
            <p class="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">{{ portal }} Access</p>
          </div>
          <button @click="handleLogout" class="p-2 text-slate-400 hover:text-royal-gold transition-colors" title="Logout">
            <LogOut class="w-5 h-5" />
          </button>
        </div>

        <!-- Mobile Menu Toggle -->
        <button 
          @click="toggleMobileMenu" 
          class="lg:hidden p-2 rounded-lg bg-royal-purple/10 dark:bg-royal-purple/20 text-royal-purple dark:text-royal-gold"
          :aria-expanded="mobileMenuOpen"
          aria-controls="mobile-menu"
          aria-label="Toggle Menu"
        >
          <Menu v-if="!mobileMenuOpen" class="w-6 h-6" />
          <X v-else class="w-6 h-6" />
        </button>
      </div>

      <!-- Mobile Dropdown -->
      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 translate-y-[-10px]"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-[-10px]"
      >
        <div 
          v-if="mobileMenuOpen" 
          id="mobile-menu"
          class="lg:hidden absolute top-full left-0 right-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-lg p-4 space-y-4 z-50 overflow-y-auto max-h-[calc(100vh-80px)]"
        >
          <!-- Mobile User Profile Section -->
          <div v-if="username" class="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 mb-4 border border-slate-100 dark:border-slate-800">
            <div class="h-10 w-10 rounded-full bg-royal-purple/10 dark:bg-royal-gold/10 flex items-center justify-center text-royal-purple dark:text-royal-gold font-bold">
              {{ username.charAt(0) }}
            </div>
            <div class="flex-grow">
              <p class="text-sm font-bold text-slate-900 dark:text-white">{{ username }}</p>
              <p class="text-[10px] font-medium text-slate-500 uppercase tracking-widest">{{ portal }} Access</p>
            </div>
          </div>

          <!-- Navigation Links -->
          <nav class="space-y-2">
            <template v-if="menuItems && menuItems.length">
              <router-link 
                v-for="item in menuItems" 
                :key="item.name" 
                :to="item.route"
                class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-colors"
                :class="[$route.path === item.route ? 'bg-royal-purple/10 dark:bg-royal-gold/20 text-royal-purple dark:text-royal-gold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800']"
              >
                <component :is="item.icon" class="w-5 h-5" />
                {{ item.name }}
              </router-link>
            </template>
          </nav>

          <!-- Logout Button -->
          <button 
            @click="handleLogout" 
            class="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg text-sm font-bold text-royal-gold dark:text-royal-gold bg-royal-gold/10 dark:bg-royal-gold/20 mt-4 border border-royal-gold/20"
          >
            <LogOut class="w-5 h-5" />
            Logout Securely
          </button>
        </div>
      </transition>
    </div>
  </header>
</template>

<style scoped>
.glass-nav {
  z-index: 100;
}
</style>
