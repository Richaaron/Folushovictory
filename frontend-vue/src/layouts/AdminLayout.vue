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
  <div class="min-h-screen flex flex-col text-[#F5F0E8] relative overflow-hidden">
    <div class="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-[#C9A84C]/3 blur-[130px] pointer-events-none" aria-hidden="true"></div>
    <div class="absolute -right-40 bottom-10 h-[500px] w-[500px] rounded-full bg-[#7A9E7E]/3 blur-[150px] pointer-events-none" aria-hidden="true"></div>

    <Navbar portal="Admin" username="Admin User" :menuItems="menuItems" :onToggleSidebar="toggleSidebar" />

    <div class="flex-grow flex p-1 sm:p-4 lg:p-6 gap-4 relative z-10">
      <aside
        class="hidden lg:flex flex-col flex-shrink-0 academic-sidebar rounded-[1.5rem] overflow-hidden transition-all duration-300"
        :class="[sidebarOpen ? 'w-64' : 'w-20']"
      >
        <div class="p-4 flex flex-col h-full">
          <button
            @click="toggleSidebar"
            class="self-end p-2.5 rounded-xl bg-[#1B2A4A]/80 border border-[#C9A84C]/15 text-[#C9A84C]/50 hover:text-[#C9A84C] hover:border-[#C9A84C]/30 active:scale-95 transition-all duration-300 mb-6"
            aria-label="Toggle Sidebar"
          >
            <ChevronLeft v-if="sidebarOpen" class="w-4 h-4" />
            <ChevronRight v-else class="w-4 h-4" />
          </button>

          <div class="flex-1 space-y-1">
            <router-link
              v-for="item in menuItems"
              :key="item.name"
              :to="item.route"
              class="sidebar-link flex items-center gap-3 px-4 py-3 text-sm font-bold group"
              :class="[$route.path === item.route ? 'sidebar-link-active' : 'sidebar-link-inactive']"
            >
              <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
              <span v-if="sidebarOpen" class="truncate">{{ item.name }}</span>
            </router-link>
          </div>

          <div v-if="sidebarOpen" class="mt-6 pt-4 border-t border-[#C9A84C]/10">
            <p class="text-[8px] font-bold uppercase tracking-[0.3em] text-[#C9A84C]/30 text-center">
              Academic Year 2025/2026
            </p>
          </div>
        </div>
      </aside>

      <main class="admin-page flex-grow overflow-x-hidden">
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
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.academic-sidebar {
  background: linear-gradient(180deg, rgba(27, 42, 74, 0.75), rgba(20, 32, 56, 0.85));
  border: 1px solid rgba(201, 168, 76, 0.12);
  box-shadow:
    0 20px 50px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(201, 168, 76, 0.05);
  backdrop-filter: blur(24px);
  position: relative;
}

.academic-sidebar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(201, 168, 76, 0.3), transparent);
  pointer-events: none;
}

.sidebar-link {
  position: relative;
  border-left: 3px solid transparent;
  border-radius: 0 0.75rem 0.75rem 0;
  margin-right: 0.5rem;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.sidebar-link-active {
  background: linear-gradient(90deg, rgba(201, 168, 76, 0.1) 0%, rgba(201, 168, 76, 0.02) 60%, transparent 100%);
  border-left: 3px solid #C9A84C;
  color: #C9A84C !important;
  font-weight: 900;
}

.sidebar-link-inactive {
  color: rgba(245, 240, 232, 0.5) !important;
}

.sidebar-link-inactive:hover {
  color: #F5F0E8 !important;
  background: rgba(201, 168, 76, 0.04);
  border-left: 3px solid rgba(201, 168, 76, 0.2);
  transform: translateX(4px);
}

.sidebar-link-active svg {
  color: #C9A84C !important;
  filter: drop-shadow(0 0 5px rgba(201, 168, 76, 0.3));
  transform: scale(1.05);
}

.sidebar-link-inactive:hover svg {
  color: #C9A84C !important;
}
</style>
