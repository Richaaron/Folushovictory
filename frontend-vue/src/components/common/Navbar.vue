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
  <header class="no-print sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-2 border-b-[#BAE6FD] shadow-sm">
    <div class="mx-auto flex max-w-7xl items-center justify-between min-h-[60px] sm:min-h-[64px] px-4 sm:px-6 lg:px-8 py-2">
      
      <!-- Brand Logo -->
      <router-link to="/" class="flex items-center gap-2.5 sm:gap-3 transition-opacity hover:opacity-90 min-w-0">
        <div class="h-10 w-10 sm:h-11 sm:w-11 rounded-xl p-1 bg-white border-2 border-amber-300 shadow-sm flex items-center justify-center shrink-0">
          <img src="/logo.png" alt="Folusho Victory Schools Logo" class="h-full w-full object-contain" />
        </div>
        <div class="min-w-0">
          <div class="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700 leading-none mb-0.5">Portal</div>
          <div class="text-xs sm:text-sm font-black text-[#0C4A6E] uppercase leading-none tracking-wide truncate">
            FOLUSHO <span class="text-amber-600">VICTORY</span>
          </div>
        </div>
      </router-link>

      <!-- Desktop Navigation Menu -->
      <nav v-if="menuItems && menuItems.length" class="hidden lg:flex items-center gap-1 bg-sky-50/80 p-1 rounded-xl border border-[#BAE6FD]">
        <router-link
          v-for="item in menuItems"
          :key="item.name"
          :to="item.route"
          class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black transition-all duration-150"
          :class="[
            $route.path === item.route 
              ? 'bg-gradient-to-r from-sky-600 to-sky-700 text-white shadow-sm' 
              : 'text-slate-800 hover:text-sky-900 hover:bg-white'
          ]"
        >
          <component :is="item.icon" class="w-4 h-4 shrink-0" />
          <span>{{ item.name }}</span>
        </router-link>
      </nav>

      <!-- User Profile & Action Controls -->
      <div class="flex items-center gap-2 sm:gap-3">
        <div v-if="username" class="hidden md:flex items-center gap-3 pl-3 border-l-2 border-[#BAE6FD]">
          <div class="text-right">
            <p class="text-xs font-black text-[#0F172A] leading-tight truncate max-w-[150px]">{{ username }}</p>
            <span class="inline-block text-[10px] font-black text-amber-900 uppercase tracking-wider bg-amber-100 px-2 py-0.5 rounded border border-amber-300 mt-0.5 shadow-xs">
              {{ portal }}
            </span>
          </div>
          
          <button 
            @click="handleLogout" 
            class="h-9 w-9 rounded-xl border border-slate-300 bg-white text-red-700 hover:bg-red-50 hover:border-red-300 flex items-center justify-center transition-colors shadow-sm" 
            title="Sign Out"
          >
            <LogOut class="w-4 h-4" />
          </button>
        </div>

        <!-- Mobile Toggle Button -->
        <button 
          @click="toggleMobileMenu" 
          class="lg:hidden h-10 w-10 rounded-xl border border-slate-300 bg-white text-[#0F172A] flex items-center justify-center hover:bg-sky-50 transition-colors shadow-sm" 
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
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div v-if="mobileMenuOpen" class="lg:hidden bg-white border-b-2 border-[#BAE6FD] shadow-xl p-4 space-y-3 z-50">
        <div v-if="username" class="flex items-center gap-3 p-3 rounded-xl bg-sky-50 border border-[#BAE6FD]">
          <div class="h-10 w-10 rounded-xl bg-white border border-amber-300 flex items-center justify-center text-sky-700 font-black text-sm shadow-sm">
            {{ username.charAt(0).toUpperCase() }}
          </div>
          <div class="flex-grow min-w-0">
            <p class="text-xs font-black text-[#0F172A] truncate">{{ username }}</p>
            <p class="text-[10px] font-black text-amber-800 uppercase tracking-wider">{{ portal }} Account</p>
          </div>
        </div>

        <nav class="space-y-1.5">
          <template v-if="menuItems && menuItems.length">
            <router-link 
              v-for="item in menuItems" 
              :key="item.name" 
              :to="item.route"
              class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-black transition-all"
              :class="[
                $route.path === item.route 
                  ? 'bg-gradient-to-r from-sky-600 to-sky-700 text-white shadow-sm' 
                  : 'text-slate-800 hover:bg-sky-50 hover:text-sky-900'
              ]"
            >
              <component :is="item.icon" class="w-4 h-4 shrink-0" />
              <span>{{ item.name }}</span>
            </router-link>
          </template>
        </nav>

        <button 
          @click="handleLogout" 
          class="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 transition-all mt-2"
        >
          <LogOut class="w-4 h-4" />
          Sign Out of {{ portal }}
        </button>
      </div>
    </transition>
  </header>
</template>
