<script setup lang="ts">
import { ref } from 'vue'
import Navbar from '../components/common/Navbar.vue'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  GraduationCap,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-vue-next'

const sidebarOpen = ref(true)

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, route: '/admin' },
  { name: 'Faculty', icon: Users, route: '/admin/teachers' },
  { name: 'Classes', icon: BookOpen, route: '/admin/classes' },
  { name: 'Students', icon: GraduationCap, route: '/admin/students' },
  { name: 'Results', icon: BarChart3, route: '/admin/broadsheet' },
  { name: 'Settings', icon: Settings, route: '/admin/settings' },
]
</script>

<template>
  <div class="min-h-screen flex flex-col bg-transparent text-[#0F172A] antialiased">
    <Navbar portal="Admin" username="Administrator" :menuItems="menuItems" :onToggleSidebar="toggleSidebar" />

    <div class="flex-grow flex p-3 sm:p-5 lg:p-6 gap-5 max-w-7xl mx-auto w-full">
      
      <!-- Collapsible Admin Sidebar (Desktop only, mobile uses Navbar dropdown) -->
      <aside
        class="hidden lg:flex flex-col flex-shrink-0 bg-white/95 backdrop-blur-md rounded-2xl border-2 border-[#BAE6FD] shadow-md overflow-hidden transition-all duration-200"
        :class="[sidebarOpen ? 'w-60' : 'w-20']"
      >
        <div class="p-3.5 flex flex-col h-full">
          <button
            @click="toggleSidebar"
            class="self-end p-2 rounded-xl bg-sky-50 border border-[#BAE6FD] text-sky-800 hover:text-sky-950 hover:bg-sky-100 active:scale-95 transition-all mb-4 shadow-xs"
            aria-label="Toggle Sidebar"
          >
            <ChevronLeft v-if="sidebarOpen" class="w-4 h-4" />
            <ChevronRight v-else class="w-4 h-4" />
          </button>

          <div class="flex-1 space-y-1.5">
            <router-link
              v-for="item in menuItems"
              :key="item.name"
              :to="item.route"
              class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-black transition-all duration-150"
              :class="[
                $route.path === item.route 
                  ? 'bg-gradient-to-r from-sky-600 to-sky-700 text-white shadow-sm' 
                  : 'text-slate-800 hover:text-sky-950 hover:bg-sky-50'
              ]"
              :title="!sidebarOpen ? item.name : undefined"
            >
              <component :is="item.icon" class="w-4 h-4 shrink-0" />
              <span v-if="sidebarOpen" class="truncate">{{ item.name }}</span>
            </router-link>
          </div>

          <!-- Quick School Badge in Sidebar -->
          <div v-if="sidebarOpen" class="mt-auto p-3 rounded-xl bg-gradient-to-r from-sky-50 to-amber-50 border border-amber-200 text-center">
            <p class="text-[10px] font-black uppercase text-amber-900 tracking-wider">Folusho Victory</p>
            <p class="text-[9px] font-extrabold text-slate-700 mt-0.5">Admin Governance 2025/2026</p>
          </div>
        </div>
      </aside>

      <!-- Main Content Container -->
      <main class="flex-1 min-w-0">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>

    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
