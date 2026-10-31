<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Menu, X, LogOut } from 'lucide-vue-next'

interface NavbarProps {
  portal: 'Admin' | 'Teacher' | 'Parent' | 'Student';
  username?: string;
  menuItems?: Array<{ name: string; icon: any; route: string }>;
  onToggleSidebar?: () => void;
}

const props = defineProps<NavbarProps>()

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
  <header class="no-print sticky top-0 z-40 bg-white border-b border-[#E5E0D8] shadow-[0_1px_3px_rgba(28,25,23,0.04)]">
    <div class="mx-auto flex max-w-7xl items-center justify-between min-h-[64px] px-4 sm:px-6 lg:px-8 py-2.5">
      
      <!-- Brand Logo -->
      <router-link to="/" class="flex items-center gap-3 transition-opacity hover:opacity-90 group">
        <div class="h-10 w-10 rounded-xl p-1 bg-white border border-[#E5E0D8] shadow-sm flex items-center justify-center">
          <img src="/logo.png" alt="Folusho Victory Schools Logo" class="h-full w-full object-contain" />
        </div>
        <div>
          <div class="text-[9px] font-bold uppercase tracking-[0.25em] text-[#E8A838] leading-none mb-0.5">Academic Portal</div>
          <div class="text-sm font-extrabold text-[#1A4D8F] uppercase leading-none tracking-wide">
            FOLUSHO <span class="text-[#1C1917]">VICTORY</span>
          </div>
        </div>
      </router-link>

      <!-- Desktop Navigation Menu (if provided) -->
      <nav v-if="menuItems && menuItems.length" class="hidden lg:flex items-center gap-1 bg-[#F7F4EE] p-1 rounded-xl border border-[#E5E0D8]">
        <router-link
          v-for="item in menuItems"
          :key="item.name"
          :to="item.route"
          class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150"
          :class="[
            $route.path === item.route 
              ? 'bg-white text-[#1A4D8F] shadow-sm border border-[#E5E0D8]' 
              : 'text-[#4B5563] hover:text-[#1C1917] hover:bg-white/50'
          ]"
        >
          <component :is="item.icon" class="w-4 h-4" />
          <span>{{ item.name }}</span>
        </router-link>
      </nav>

      <!-- User Profile & Action Controls -->
      <div class="flex items-center gap-2 sm:gap-3">
        <div v-if="username" class="hidden md:flex items-center gap-3 pl-3 border-l border-[#E5E0D8]">
          <div class="text-right">
            <p class="text-xs font-bold text-[#1C1917] leading-tight truncate max-w-[160px]">{{ username }}</p>
            <span class="inline-block text-[9px] font-bold text-[#1A4D8F] uppercase tracking-wider bg-[#1A4D8F]/10 px-1.5 py-0.5 rounded">
              {{ portal }}
            </span>
          </div>
          
          <button 
            @click="handleLogout" 
            class="h-9 w-9 rounded-xl border border-[#E5E0D8] bg-[#F7F4EE] text-[#8B263E] hover:bg-[#8B263E]/10 flex items-center justify-center transition-colors" 
            title="Sign Out"
          >
            <LogOut class="w-4 h-4" />
          </button>
        </div>

        <!-- Mobile Toggle Button -->
        <button 
          @click="toggleMobileMenu" 
          class="lg:hidden h-9 w-9 rounded-xl border border-[#E5E0D8] bg-[#F7F4EE] text-[#4B5563] flex items-center justify-center hover:bg-white transition-colors"
          :aria-expanded="mobileMenuOpen" 
          aria-label="Toggle Navigation"
        >
          <Menu v-if="!mobileMenuOpen" class="w-5 h-5" />
          <X v-else class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- Mobile Navigation Dropdown -->
    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div v-if="mobileMenuOpen" class="lg:hidden absolute top-full left-0 right-0 bg-white border-b border-[#E5E0D8] shadow-lg p-4 space-y-3 z-50">
        <div v-if="username" class="flex items-center gap-3 p-3 rounded-xl bg-[#F7F4EE] border border-[#E5E0D8]">
          <div class="h-9 w-9 rounded-lg bg-white border border-[#E5E0D8] flex items-center justify-center text-[#1A4D8F] font-black text-sm">
            {{ username.charAt(0).toUpperCase() }}
          </div>
          <div class="flex-grow">
            <p class="text-xs font-bold text-[#1C1917]">{{ username }}</p>
            <p class="text-[10px] font-semibold text-[#1A4D8F] uppercase tracking-wider">{{ portal }} Account</p>
          </div>
        </div>

        <nav class="space-y-1">
          <template v-if="menuItems && menuItems.length">
            <router-link 
              v-for="item in menuItems" 
              :key="item.name" 
              :to="item.route"
              class="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all"
              :class="[
                $route.path === item.route 
                  ? 'bg-[#1A4D8F] text-white shadow-sm' 
                  : 'text-[#4B5563] hover:bg-[#F7F4EE] hover:text-[#1C1917]'
              ]"
            >
              <component :is="item.icon" class="w-4 h-4 shrink-0" />
              <span>{{ item.name }}</span>
            </router-link>
          </template>
        </nav>

        <button 
          @click="handleLogout"
          class="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#8B263E] bg-[#8B263E]/10 hover:bg-[#8B263E]/15 border border-[#8B263E]/20 transition-all mt-2"
        >
          <LogOut class="w-4 h-4" />
          Sign Out Securely
        </button>
      </div>
    </transition>
  </header>
</template>
