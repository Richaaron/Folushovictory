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
  <div class="min-h-screen flex flex-col bg-slate-50 dark:bg-[#020617] selection:bg-nebula-500 selection:text-white">
    <Navbar portal="Admin" username="Admin User" />

    <div class="flex-grow flex flex-col lg:flex-row p-4 lg:p-6 gap-6">
      <!-- Floating Sidebar -->
      <aside 
        class="glass-sidebar rounded-[2.5rem] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] overflow-hidden hidden lg:block sticky top-32 h-[calc(100vh-10rem)]"
        :class="[sidebarOpen ? 'w-72' : 'w-24']"
      >
        <div class="p-6 h-full flex flex-col">
          <div class="space-y-3 flex-grow">
            <router-link 
              v-for="item in menuItems" 
              :key="item.name"
              :to="item.route"
              class="flex items-center gap-4 p-4 rounded-3xl transition-all duration-300 group relative"
              :class="[
                $route.path === item.route 
                  ? 'bg-nebula-500 text-white shadow-2xl shadow-nebula-500/40' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-nebula-500 dark:hover:text-nebula-400'
              ]"
            >
              <div class="relative z-10">
                <component :is="item.icon" class="w-6 h-6 shrink-0 transition-transform duration-500 group-hover:scale-110" />
              </div>
              <span v-if="sidebarOpen" class="font-black text-[11px] uppercase tracking-[0.2em] whitespace-nowrap relative z-10">{{ item.name }}</span>
              
              <!-- Indicator for active route -->
              <div v-if="$route.path === item.route" class="absolute inset-y-4 right-4 w-1.5 bg-white rounded-full"></div>

              <div v-if="!sidebarOpen" class="absolute left-full ml-6 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 translate-x-[-10px] group-hover:translate-x-0 z-50 shadow-2xl">
                {{ item.name }}
              </div>
            </router-link>
          </div>
          
          <button 
            @click="sidebarOpen = !sidebarOpen"
            class="flex w-full items-center gap-4 p-4 rounded-3xl text-slate-400 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 group"
          >
            <div class="bg-slate-100 dark:bg-slate-800 p-2 rounded-xl group-hover:bg-nebula-500 group-hover:text-white transition-colors">
              <ChevronRight class="w-5 h-5 transition-transform duration-500" :class="{'rotate-180': sidebarOpen}" />
            </div>
            <span v-if="sidebarOpen" class="font-black text-[11px] uppercase tracking-[0.2em]">Collapse</span>
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-grow">
        <div class="mx-auto max-w-7xl h-full">
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
