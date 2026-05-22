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
  <header class="no-print premium-nav py-3 px-5 relative">
    <!-- Top gold hairline accent -->
    <div class="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent pointer-events-none" aria-hidden="true"></div>

    <div class="mx-auto flex max-w-7xl items-center justify-between min-h-[56px]">
      <!-- Logo + Brand -->
      <router-link to="/" class="flex items-center gap-3.5 transition-opacity duration-300 hover:opacity-85 group">
        <div class="h-10 w-10 rounded-xl p-1 border border-violet-500/20 bg-black/60 shadow-[0_0_12px_rgba(139,92,246,0.15)] group-hover:border-amber-500/30 group-hover:shadow-[0_0_18px_rgba(212,175,55,0.2)] transition-all duration-400">
          <img src="/logo.png" alt="Folusho Victory Schools Logo" class="h-full w-full object-contain" />
        </div>
        <div class="hidden sm:block">
          <div class="text-[9px] font-black uppercase tracking-[0.35em] text-amber-400/80 leading-none mb-1">Academy Portal</div>
          <div class="text-base font-black text-white uppercase leading-none tracking-wider">
            FOLUSHO <span class="bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">VICTORY</span>
          </div>
        </div>
      </router-link>

      <!-- Right Controls -->
      <div class="flex items-center gap-2 sm:gap-3">

        <!-- Theme Toggle -->
        <button
          @click="toggleTheme"
          class="nav-icon-btn"
          :aria-label="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
        >
          <Sun v-if="isDark" class="w-4 h-4" />
          <Moon v-else class="w-4 h-4" />
        </button>

        <!-- User Menu (Desktop) -->
        <div v-if="username" class="hidden md:flex items-center gap-3 pl-3 border-l border-violet-500/15">
          <div class="text-right">
            <p class="text-xs font-black text-white leading-none tracking-wide">{{ username }}</p>
            <p class="text-[9px] font-bold text-amber-400/70 mt-1 uppercase tracking-[0.25em]">{{ portal }} Access</p>
          </div>
          <button
            @click="handleLogout"
            class="nav-icon-btn text-slate-400 hover:text-rose-400 hover:border-rose-500/20"
            title="Logout"
          >
            <LogOut class="w-4 h-4" />
          </button>
        </div>

        <!-- Mobile Menu Toggle -->
        <button
          @click="toggleMobileMenu"
          class="lg:hidden nav-icon-btn"
          :aria-expanded="mobileMenuOpen"
          aria-controls="mobile-menu"
          aria-label="Toggle Navigation Menu"
        >
          <Menu v-if="!mobileMenuOpen" class="w-5 h-5" />
          <X v-else class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- Mobile Dropdown -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-if="mobileMenuOpen"
        id="mobile-menu"
        class="lg:hidden absolute top-full left-0 right-0 mobile-dropdown p-5 space-y-4 z-50 overflow-y-auto max-h-[calc(100vh-80px)]"
      >
        <!-- Mobile User Profile -->
        <div v-if="username" class="flex items-center gap-3 p-3.5 rounded-2xl bg-violet-950/30 border border-violet-500/15 mb-4">
          <div class="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-900/60 to-black flex items-center justify-center text-amber-400 font-black border border-violet-500/20 text-sm shadow-inner">
            {{ username.charAt(0) }}
          </div>
          <div class="flex-grow">
            <p class="text-sm font-black text-white">{{ username }}</p>
            <p class="text-[9px] font-bold text-amber-400/70 uppercase tracking-[0.25em] mt-0.5">{{ portal }} Access</p>
          </div>
        </div>

        <!-- Mobile Navigation Links -->
        <nav class="space-y-1.5">
          <template v-if="menuItems && menuItems.length">
            <router-link
              v-for="item in menuItems"
              :key="item.name"
              :to="item.route"
              class="mobile-nav-link flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold"
              :class="[$route.path === item.route ? 'mobile-nav-link-active' : 'mobile-nav-link-inactive']"
            >
              <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
              {{ item.name }}
            </router-link>
          </template>
        </nav>

        <!-- Mobile Logout -->
        <button
          @click="handleLogout"
          class="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-sm font-black text-rose-400 bg-rose-500/8 border border-rose-500/15 hover:bg-rose-500/15 hover:border-rose-500/30 transition-all duration-300 mt-2 active:scale-[0.98]"
        >
          <LogOut class="w-4 h-4" />
          Logout Securely
        </button>
      </div>
    </transition>
  </header>
</template>

<style scoped>
/* Premium Navbar */
.premium-nav {
  background: rgba(5, 3, 9, 0.85);
  border-bottom: 1px solid rgba(139, 92, 246, 0.12);
  backdrop-filter: blur(22px);
  -webkit-backdrop-filter: blur(22px);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
  z-index: 100;
  position: relative;
}

/* Icon Buttons */
.nav-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 0.75rem;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(139, 92, 246, 0.12);
  color: #94a3b8;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.nav-icon-btn:hover {
  color: #d4af37;
  border-color: rgba(212, 175, 55, 0.3);
  background: rgba(139, 92, 246, 0.08);
  box-shadow: 0 0 14px rgba(212, 175, 55, 0.12);
  transform: translateY(-1px);
}

.nav-icon-btn:active {
  transform: scale(0.95);
}

/* Mobile Dropdown Panel */
.mobile-dropdown {
  background: rgba(5, 3, 9, 0.97);
  border-bottom: 1px solid rgba(139, 92, 246, 0.15);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
}

/* Mobile Nav Links */
.mobile-nav-link {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  border-left: 3px solid transparent;
}

.mobile-nav-link-active {
  background: linear-gradient(90deg, rgba(139, 92, 246, 0.18) 0%, rgba(139, 92, 246, 0.04) 70%, transparent 100%);
  border-left: 3px solid #d4af37;
  color: #fbbf24 !important;
  font-weight: 900;
}

.mobile-nav-link-inactive {
  color: #94a3b8;
  border-left: 3px solid transparent;
}

.mobile-nav-link-inactive:hover {
  color: #ffffff;
  background: rgba(139, 92, 246, 0.07);
  border-left: 3px solid rgba(212, 175, 55, 0.25);
  transform: translateX(3px);
}
</style>
