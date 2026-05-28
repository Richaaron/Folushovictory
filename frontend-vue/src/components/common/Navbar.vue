<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Menu, X, LogOut } from 'lucide-vue-next'

const props = defineProps<{
  portal: 'Admin' | 'Teacher' | 'Parent'
  username?: string
  menuItems?: Array<{ name: string; icon: any; route: string }>
  onToggleSidebar?: () => void
}>()

const router = useRouter()
const mobileMenuOpen = ref(false)

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login/' + props.portal.toLowerCase())
}

watch(() => router.currentRoute.value.path, () => {
  mobileMenuOpen.value = false
})
</script>

<template>
  <header class="no-print relative">
    <div class="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#C9A84C]/60 to-transparent pointer-events-none" aria-hidden="true"></div>

    <div class="mx-auto flex max-w-7xl items-center justify-between min-h-[64px] px-5 py-3">
      <router-link to="/" class="flex items-center gap-3.5 transition-opacity hover:opacity-85 group">
        <div class="h-10 w-10 rounded-xl p-1 border border-[#C9A84C]/25 bg-[#1B2A4A]/80 shadow-[0_0_12px_rgba(201,168,76,0.08)] group-hover:shadow-[0_0_18px_rgba(201,168,76,0.18)] transition-all duration-400">
          <img src="/logo.png" alt="Folusho Victory Schools Logo" class="h-full w-full object-contain" />
        </div>
        <div class="hidden sm:block">
          <div class="text-[9px] font-black uppercase tracking-[0.35em] text-[#C9A84C]/70 leading-none mb-1">Academy Portal</div>
          <div class="text-sm font-black text-[#F5F0E8] uppercase leading-none tracking-wider" style="font-family: 'Comic Neue', 'Comic Sans MS', cursive, sans-serif;">
            FOLUSHO <span class="text-[#C9A84C]">VICTORY</span>
          </div>
        </div>
      </router-link>

      <div class="flex items-center gap-2 sm:gap-3">
        <div v-if="username" class="hidden md:flex items-center gap-3 pl-3 border-l border-[#C9A84C]/15">
          <div class="text-right">
            <p class="text-xs font-black text-[#F5F0E8] leading-none tracking-wide">{{ username }}</p>
            <p class="text-[9px] font-bold text-[#C9A84C]/60 mt-1 uppercase tracking-[0.25em]">{{ portal }} Access</p>
          </div>
          <button @click="handleLogout" class="academic-nav-btn text-[#8B3A52] hover:text-[#B45A74] hover:border-[#8B3A52]/20" title="Logout">
            <LogOut class="w-4 h-4" />
          </button>
        </div>

        <button @click="toggleMobileMenu" class="lg:hidden academic-nav-btn" :aria-expanded="mobileMenuOpen" aria-label="Toggle Navigation">
          <Menu v-if="!mobileMenuOpen" class="w-5 h-5" />
          <X v-else class="w-5 h-5" />
        </button>
      </div>
    </div>

    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div v-if="mobileMenuOpen" id="mobile-menu" class="lg:hidden absolute top-full left-0 right-0 mobile-dropdown p-5 space-y-4 z-50 overflow-y-auto max-h-[calc(100vh-80px)]">
        <div v-if="username" class="flex items-center gap-3 p-3.5 rounded-2xl bg-[#1B2A4A]/60 border border-[#C9A84C]/15 mb-4">
          <div class="h-10 w-10 rounded-xl bg-[#1B2A4A] flex items-center justify-center text-[#C9A84C] font-black border border-[#C9A84C]/20 text-sm">
            {{ username.charAt(0) }}
          </div>
          <div class="flex-grow">
            <p class="text-sm font-black text-[#F5F0E8]">{{ username }}</p>
            <p class="text-[9px] font-bold text-[#C9A84C]/60 uppercase tracking-[0.25em] mt-0.5">{{ portal }} Access</p>
          </div>
        </div>

        <nav class="space-y-1.5">
          <template v-if="menuItems && menuItems.length">
            <router-link v-for="item in menuItems" :key="item.name" :to="item.route"
              class="mobile-nav-link flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold"
              :class="[$route.path === item.route ? 'mobile-nav-link-active' : 'mobile-nav-link-inactive']">
              <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
              {{ item.name }}
            </router-link>
          </template>
        </nav>

        <button @click="handleLogout"
          class="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-sm font-black text-[#B45A74] bg-[#8B3A52]/10 border border-[#8B3A52]/20 hover:bg-[#8B3A52]/20 transition-all mt-2">
          <LogOut class="w-4 h-4" />
          Logout Securely
        </button>
      </div>
    </transition>
  </header>
</template>

<style scoped>
.premium-nav {
  background: rgba(27, 42, 74, 0.85);
  border-bottom: 1px solid rgba(201, 168, 76, 0.12);
  backdrop-filter: blur(22px);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
  z-index: 100;
}

.academic-nav-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 0.75rem;
  background: rgba(27, 42, 74, 0.6);
  border: 1px solid rgba(201, 168, 76, 0.12);
  color: rgba(245, 240, 232, 0.6);
  transition: all 0.3s ease;
}

.academic-nav-btn:hover {
  color: #C9A84C;
  border-color: rgba(201, 168, 76, 0.3);
  background: rgba(27, 42, 74, 0.9);
  box-shadow: 0 0 14px rgba(201, 168, 76, 0.08);
  transform: translateY(-1px);
}

.academic-nav-btn:active {
  transform: scale(0.95);
}

.mobile-dropdown {
  background: rgba(20, 32, 56, 0.97);
  border-bottom: 1px solid rgba(201, 168, 76, 0.12);
  backdrop-filter: blur(24px);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
}

.mobile-nav-link {
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
}

.mobile-nav-link-active {
  background: linear-gradient(90deg, rgba(201, 168, 76, 0.12) 0%, rgba(201, 168, 76, 0.02) 70%, transparent 100%);
  border-left: 3px solid #C9A84C;
  color: #C9A84C !important;
  font-weight: 900;
}

.mobile-nav-link-inactive {
  color: rgba(245, 240, 232, 0.55);
}

.mobile-nav-link-inactive:hover {
  color: #F5F0E8;
  background: rgba(201, 168, 76, 0.04);
  border-left: 3px solid rgba(201, 168, 76, 0.2);
  transform: translateX(3px);
}
</style>
