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
  Menu,
  ChevronRight
} from 'lucide-vue-next'

const sidebarOpen = ref(true)

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, route: '/admin' },
  { name: 'Teachers', icon: Users, route: '/admin/teachers' },
  { name: 'Classes', icon: BookOpen, route: '/admin/classes' },
  { name: 'Students', icon: GraduationCap, route: '/admin/students' },
  { name: 'Broadsheet', icon: BarChart3, route: '/admin/broadsheet' },
  { name: 'Settings', icon: Settings, route: '/settings' },
]
</script>

<template>
  <div class="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
    <Navbar portal="Admin" username="Admin User" />

    <div class="flex-grow flex flex-col lg:flex-row">
      <!-- Sidebar -->
      <aside 
        class="bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 z-40"
        :class="[sidebarOpen ? 'w-64' : 'w-20']"
      >
        <div class="sticky top-20 p-4 space-y-2">
          <router-link 
            v-for="item in menuItems" 
            :key="item.name"
            :to="item.route"
            class="flex items-center gap-4 p-4 rounded-2xl transition-all group"
            :class="[
              $route.path === item.route 
                ? 'bg-royal-purple text-white shadow-lg shadow-purple-200 dark:shadow-purple-900/20' 
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
            ]"
          >
            <component :is="item.icon" class="w-6 h-6 shrink-0" />
            <span v-if="sidebarOpen" class="font-bold text-sm uppercase tracking-widest whitespace-nowrap">{{ item.name }}</span>
            
            <div v-if="!sidebarOpen" class="absolute left-full ml-2 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              {{ item.name }}
            </div>
          </router-link>
          
          <button 
            @click="sidebarOpen = !sidebarOpen"
            class="hidden lg:flex w-full items-center gap-4 p-4 rounded-2xl text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            <ChevronRight class="w-6 h-6 transition-transform" :class="{'rotate-180': sidebarOpen}" />
            <span v-if="sidebarOpen" class="font-bold text-sm uppercase tracking-widest">Collapse</span>
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-grow p-4 sm:p-8 overflow-x-hidden">
        <div class="mx-auto max-w-7xl">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
