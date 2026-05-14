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
  <div class="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
    <Navbar portal="Admin" username="Admin User" :menuItems="menuItems" :onToggleSidebar="toggleSidebar" />

    <div class="flex-grow flex p-1 sm:p-4 lg:p-6 gap-4">
      <!-- Desktop Sidebar -->
      <aside 
        class="hidden lg:flex flex-col flex-shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-all duration-300"
        :class="[sidebarOpen ? 'w-64' : 'w-20']"
      >
        <div class="p-4 flex flex-col h-full">
          <button @click="toggleSidebar" class="self-end p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 mb-4">
            <ChevronLeft v-if="sidebarOpen" class="w-5 h-5" />
            <ChevronRight v-else class="w-5 h-5" />
          </button>
          
          <nav class="space-y-1 flex-grow">
            <router-link 
              v-for="item in menuItems" 
              :key="item.name"
              :to="item.route"
              class="flex items-center gap-3 p-3 rounded-lg transition-colors font-bold text-sm"
              :class="[
                $route.path === item.route 
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              ]"
            >
              <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
              <span v-if="sidebarOpen" class="truncate">{{ item.name }}</span>
            </router-link>
          </nav>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-grow overflow-x-hidden">
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
</style>
