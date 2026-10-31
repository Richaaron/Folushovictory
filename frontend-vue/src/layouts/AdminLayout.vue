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
  <div class="min-h-screen flex flex-col bg-[#F8FAFC] text-[#1E293B] antialiased">
    <Navbar portal="Admin" username="Administrator" :menuItems="menuItems" :onToggleSidebar="toggleSidebar" />

    <div class="flex-grow flex p-3 sm:p-5 lg:p-6 gap-5 max-w-7xl mx-auto w-full">
      
      <!-- Collapsible Admin Sidebar (Desktop only, mobile uses Navbar dropdown) -->
      <aside
        class="hidden lg:flex flex-col flex-shrink-0 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden transition-all duration-200"
        :class="[sidebarOpen ? 'w-60' : 'w-20']"
      >
        <div class="p-3.5 flex flex-col h-full">
          <button
            @click="toggleSidebar"
            class="self-end p-2 rounded-xl bg-[#F1F5F9] border border-[#E2E8F0] text-[#475569] hover:text-[#0F172A] hover:bg-[#E2E8F0] active:scale-95 transition-all mb-4"
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
              class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150"
              :class="[
                $route.path === item.route 
                  ? 'bg-[#1E3A8A] text-white shadow-sm' 
                  : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
              ]"
            >
              <component :is="item.icon" class="w-4 h-4 flex-shrink-0" />
              <span v-if="sidebarOpen" class="truncate">{{ item.name }}</span>
            </router-link>
          </div>

          <div v-if="sidebarOpen" class="mt-4 pt-3 border-t border-[#E2E8F0]">
            <p class="text-[10px] font-bold uppercase tracking-wider text-[#64748B] text-center">
              Session 2025/2026
            </p>
          </div>
        </div>
      </aside>

      <!-- Main Content Area -->
      <main class="flex-grow overflow-x-hidden min-w-0 w-full">
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
