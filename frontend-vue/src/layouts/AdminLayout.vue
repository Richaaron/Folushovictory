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
  <div class="min-h-screen flex flex-col bg-[#030206] text-slate-100 relative overflow-hidden">
    <!-- Ambient Pulsing Glow Backdrops -->
    <div class="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-violet-600/5 blur-[130px] pointer-events-none animate-pulse-glow-purple" aria-hidden="true"></div>
    <div class="absolute -right-40 bottom-10 h-[500px] w-[500px] rounded-full bg-amber-500/3 blur-[150px] pointer-events-none animate-pulse-glow-gold" aria-hidden="true"></div>

    <Navbar portal="Admin" username="Admin User" :menuItems="menuItems" :onToggleSidebar="toggleSidebar" />

    <div class="flex-grow flex p-1 sm:p-4 lg:p-6 gap-4 relative z-10">
      <!-- Desktop Sidebar -->
      <aside 
        class="hidden lg:flex flex-col flex-shrink-0 premium-cyber-sidebar rounded-[2rem] overflow-hidden transition-all duration-300"
        :class="[sidebarOpen ? 'w-64' : 'w-20']"
      >
        <div class="p-4 flex flex-col h-full">
          <button 
            @click="toggleSidebar" 
            class="self-end p-2.5 rounded-xl bg-black/60 border border-violet-500/10 text-slate-400 hover:text-amber-400 hover:border-amber-500/30 hover:bg-violet-950/20 active:scale-95 shadow-sm transition-all duration-300 mb-6"
            aria-label="Toggle Sidebar Menu"
          >
            <ChevronLeft v-if="sidebarOpen" class="w-4 h-4" />
            <ChevronRight v-else class="w-4 h-4" />
          </button>
          
          <nav class="space-y-1.5 flex-grow">
            <router-link 
              v-for="item in menuItems" 
              :key="item.name"
              :to="item.route"
              class="sidebar-link flex items-center gap-3 p-3 rounded-lg font-bold text-sm group"
              :class="[
                $route.path === item.route 
                  ? 'sidebar-link-active' 
                  : 'sidebar-link-inactive'
              ]"
            >
              <component :is="item.icon" class="w-5 h-5 flex-shrink-0 transition-colors duration-300" />
              <span v-if="sidebarOpen" class="truncate">{{ item.name }}</span>
            </router-link>
          </nav>
        </div>
      </aside>

      <!-- Main Content -->
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

/* Scoped Overrides for Header and Child Navbar components */
:deep(.glass-nav) {
  background: rgba(6, 4, 10, 0.8) !important;
  border-bottom: 1px solid rgba(139, 92, 246, 0.15) !important;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(20px) !important;
}

/* Scoped Cyber Sidebar Design */
.premium-cyber-sidebar {
  background: rgba(5, 4, 8, 0.75) !important;
  border: 1px solid rgba(139, 92, 246, 0.15) !important;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(24px);
}

/* Sidebar Links */
.sidebar-link {
  position: relative;
  border-left: 3px solid transparent;
  padding: 0.85rem 1.25rem;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  border-radius: 0 1rem 1rem 0;
  margin-right: 0.5rem;
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.sidebar-link-active {
  background: linear-gradient(90deg, rgba(139, 92, 246, 0.16) 0%, rgba(139, 92, 246, 0.04) 60%, transparent 100%);
  border-left: 3px solid #d4af37 !important; /* Gold Left indicator border */
  color: #fbbf24 !important; /* Gold text color */
  box-shadow: inset 4px 0 15px -4px rgba(139, 92, 246, 0.35);
  font-weight: 900;
}

.sidebar-link-inactive {
  color: #94a3b8 !important; /* Satin Chrome Silver base color */
}

.sidebar-link-inactive:hover {
  color: #ffffff !important;
  background: rgba(139, 92, 246, 0.06);
  border-left: 3px solid rgba(212, 175, 55, 0.3); /* Chrome-gold micro indicator */
  transform: translateX(4px);
}

/* Icon Animations and Colors */
.sidebar-link-active :deep(svg),
.sidebar-link-active svg {
  color: #d4af37 !important;
  filter: drop-shadow(0 0 5px rgba(212, 175, 55, 0.5));
  transform: scale(1.05);
  transition: all 0.35s ease;
}

.sidebar-link-inactive:hover :deep(svg),
.sidebar-link-inactive:hover svg {
  color: #d4af37 !important;
  filter: drop-shadow(0 0 3px rgba(212, 175, 55, 0.3));
}

/* Keyframes for Ambient Glow */
@keyframes pulse-glow {
  0%, 100% {
    opacity: 0.15;
    transform: scale(1);
  }
  50% {
    opacity: 0.3;
    transform: scale(1.06);
  }
}

.animate-pulse-glow-purple {
  animation: pulse-glow 9s ease-in-out infinite;
}

.animate-pulse-glow-gold {
  animation: pulse-glow 14s ease-in-out infinite alternate;
}
</style>
