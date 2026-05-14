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
  ChevronRight
} from 'lucide-vue-next'

const sidebarOpen = ref(false)

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, route: '/admin' },
  { name: 'Teachers', icon: Users, route: '/admin/teachers' },
  { name: 'Classes', icon: BookOpen, route: '/admin/classes' },
  { name: 'Students', icon: GraduationCap, route: '/admin/students' },
  { name: 'Broadsheet', icon: BarChart3, route: '/admin/broadsheet' },
  { name: 'Settings', icon: Settings, route: '/admin/settings' },
]

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const closeSidebar = () => {
  sidebarOpen.value = false
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-slate-50 dark:bg-[#020617] selection:bg-nebula-500 selection:text-white">
    <Navbar portal="Admin" username="Admin User" :menuItems="menuItems" :onToggleSidebar="toggleSidebar" />

    <div class="flex-grow flex flex-col lg:flex-row p-2 sm:p-4 lg:p-6 gap-3 sm:gap-4 lg:gap-6">
      <!-- Floating Sidebar - Mobile drawer/drawer, desktop sticky -->
      <aside 
        class="glass-sidebar rounded-xl sm:rounded-2xl lg:rounded-[2.5rem] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] overflow-hidden 
        hidden lg:flex sticky lg:relative flex-col flex-shrink-0
        h-[calc(100vh-10rem)]
        z-auto"
        :class="[
          sidebarOpen ? 'translate-x-0 lg:w-72' : '-translate-x-full lg:translate-x-0 lg:w-24'
        ]"
        role="navigation"
        aria-label="Sidebar Navigation"
      >
        <div class="p-4 sm:p-6 h-full flex flex-col">
          <div class="space-y-2 sm:space-y-3 flex-grow overflow-y-auto">
            <router-link 
              v-for="item in menuItems" 
              :key="item.name"
              :to="item.route"
              @click="closeSidebar"
              class="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl sm:rounded-3xl transition-all duration-300 group relative focus-visible:ring-inset focus-visible:ring-4 focus-visible:ring-nebula-500/40 min-h-[44px]"
              :class="[
                $route.path.startsWith(item.route) 
                  ? 'bg-nebula-500 text-white shadow-2xl shadow-nebula-500/40' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-nebula-500 dark:hover:text-nebula-400'
              ]"
            >
              <div class="relative z-10">
                <component :is="item.icon" class="w-5 sm:w-6 h-5 sm:h-6 shrink-0 transition-transform duration-500 group-hover:scale-110" aria-hidden="true" />
              </div>
              <span v-if="sidebarOpen" class="font-black text-[10px] sm:text-[11px] uppercase tracking-[0.2em] whitespace-nowrap relative z-10">{{ item.name }}</span>
              
              <!-- Indicator for active route -->
              <div v-if="$route.path === item.route" class="absolute inset-y-4 right-4 w-1.5 bg-white rounded-full" aria-hidden="true"></div>

              <!-- Tooltip for collapsed state -->
              <div v-if="!sidebarOpen" class="absolute left-full ml-4 px-3 sm:px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-lg sm:rounded-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 translate-x-[-10px] group-hover:translate-x-0 z-50 shadow-2xl whitespace-nowrap">
                {{ item.name }}
              </div>
            </router-link>
          </div>
          
          <!-- Collapse/Expand Button - Desktop only -->
          <button 
            @click="sidebarOpen = !sidebarOpen"
            class="hidden lg:flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl sm:rounded-3xl text-slate-400 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 group focus-visible:ring-4 focus-visible:ring-nebula-500/40 mt-4 min-h-[44px]"
            :aria-label="sidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'"
            type="button"
          >
            <div class="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg sm:rounded-xl group-hover:bg-nebula-500 group-hover:text-white transition-colors">
              <ChevronRight class="w-4 sm:w-5 h-4 sm:h-5 transition-transform duration-500" :class="{'rotate-180': sidebarOpen}" aria-hidden="true" />
            </div>
            <span v-if="sidebarOpen" class="font-black text-[10px] uppercase tracking-[0.2em]">Collapse</span>
          </button>
        </div>
      </aside>

      <!-- Mobile Sidebar Overlay -->
      <transition 
        enter-active-class="transition duration-300"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div 
          v-if="sidebarOpen"
          @click="sidebarOpen = false"
          class="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-30 lg:hidden"
          aria-hidden="true"
        ></div>
      </transition>

      <!-- Main Content -->
      <main class="flex-grow min-w-0" role="main">
        <div class="mx-auto max-w-7xl h-full w-full">
          <router-view v-slot="{ Component }">
            <transition 
              name="page" 
              mode="out-in"
              enter-active-class="transition duration-500 ease-out"
              enter-from-class="opacity-0 translate-y-8 scale-95"
              enter-to-class="opacity-100 translate-y-0 scale-100"
              leave-active-class="transition duration-300 ease-in"
              leave-from-class="opacity-100 translate-y-0 scale-100"
              leave-to-class="opacity-0 -translate-y-8 scale-95"
            >
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
