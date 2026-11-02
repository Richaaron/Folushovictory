<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BarChart3,
  MoreHorizontal,
  ClipboardList,
  BookOpen,
  KeyRound,
  Bell,
  Settings,
  LogOut,
  X,
  ChevronRight
} from 'lucide-vue-next'

interface Props {
  portal: 'Admin' | 'Teacher' | 'Parent' | 'Student';
  username?: string;
}

const props = withDefaults(defineProps<Props>(), {
  portal: 'Admin',
  username: 'User'
})

const route = useRoute()
const router = useRouter()
const sheetOpen = ref(false)

const openSheet = () => {
  sheetOpen.value = true
}

const closeSheet = () => {
  sheetOpen.value = false
}

const handleLogout = () => {
  closeSheet()
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login/' + props.portal.toLowerCase())
}

const navigateTo = (path: string) => {
  closeSheet()
  router.push(path)
}

const scrollToSection = (id: string) => {
  closeSheet()
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}

// Mobile Bottom Navigation Tabs Configuration
const bottomTabs = computed(() => {
  switch (props.portal) {
    case 'Admin':
      return [
        { name: 'Home', icon: LayoutDashboard, route: '/admin' },
        { name: 'Faculty', icon: Users, route: '/admin/teachers' },
        { name: 'Students', icon: GraduationCap, route: '/admin/students' },
        { name: 'Results', icon: BarChart3, route: '/admin/broadsheet' },
        { name: 'More', icon: MoreHorizontal, isAction: true, onClick: openSheet }
      ]
    case 'Teacher':
      return [
        { name: 'Home', icon: LayoutDashboard, route: '/teacher' },
        { name: 'Tasks', icon: ClipboardList, route: '/teacher/activities' },
        { name: 'Settings', icon: Settings, route: '/teacher/settings' },
        { name: 'More', icon: MoreHorizontal, isAction: true, onClick: openSheet }
      ]
    case 'Student':
      return [
        { name: 'Portal', icon: LayoutDashboard, route: '/student' },
        { name: 'Tasks', icon: ClipboardList, isAction: true, onClick: () => scrollToSection('student-tasks-section') },
        { name: 'Subjects', icon: BookOpen, isAction: true, onClick: () => scrollToSection('student-subjects-section') },
        { name: 'PIN', icon: KeyRound, isAction: true, onClick: () => scrollToSection('student-pin-section') },
        { name: 'More', icon: MoreHorizontal, isAction: true, onClick: openSheet }
      ]
    case 'Parent':
      return [
        { name: 'Ward', icon: LayoutDashboard, route: '/parent' },
        { name: 'Notices', icon: Bell, isAction: true, onClick: () => scrollToSection('parent-notices-section') },
        { name: 'Settings', icon: Settings, route: '/parent/settings' },
        { name: 'More', icon: MoreHorizontal, isAction: true, onClick: openSheet }
      ]
    default:
      return []
  }
})

// More drawer extra links
const drawerLinks = computed(() => {
  if (props.portal === 'Admin') {
    return [
      { name: 'Class & Arm Registry', desc: 'Manage arms, sessions & levels', icon: BookOpen, path: '/admin/classes' },
      { name: 'Master Broadsheet', desc: 'Term results & grading matrix', icon: BarChart3, path: '/admin/broadsheet' },
      { name: 'School & Portal Settings', desc: 'School branding, terms & password', icon: Settings, path: '/admin/settings' }
    ]
  }
  if (props.portal === 'Teacher') {
    return [
      { name: 'Learning Activities', desc: 'Create quizzes, assignments & mark work', icon: ClipboardList, path: '/teacher/activities' },
      { name: 'Account Credentials', desc: 'Update staff password & security', icon: Settings, path: '/teacher/settings' }
    ]
  }
  if (props.portal === 'Parent') {
    return [
      { name: 'Account Security', desc: 'Change access PIN / password', icon: Settings, path: '/parent/settings' }
    ]
  }
  return [
    { name: 'My Learning Portal', desc: 'Curriculum & continuous assessment', icon: LayoutDashboard, path: '/student' }
  ]
})
</script>

<template>
  <div>
    <!-- Floating Native Mobile App Dock -->
    <nav 
      class="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-xl border-t-2 border-[#BAE6FD] pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(2,132,199,0.12)] transition-all"
      aria-label="Mobile Bottom Navigation"
    >
      <div class="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        <template v-for="tab in bottomTabs" :key="tab.name">
          
          <!-- Route Tab -->
          <router-link
            v-if="tab.route"
            :to="tab.route"
            class="flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition-all duration-150 active:scale-90 min-w-0"
            :class="[
              route.path === tab.route
                ? 'text-[#0C4A6E] font-black'
                : 'text-slate-600 font-bold hover:text-sky-900'
            ]"
          >
            <div 
              class="relative flex items-center justify-center w-10 h-7 rounded-full transition-colors"
              :class="route.path === tab.route ? 'bg-sky-100 text-sky-800' : 'text-slate-600'"
            >
              <component :is="tab.icon" class="w-5 h-5 shrink-0" />
              <!-- Active Indicator Dot -->
              <span 
                v-if="route.path === tab.route"
                class="absolute -top-0.5 right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white"
              />
            </div>
            <span class="text-[10px] tracking-tight mt-0.5 truncate w-full text-center">
              {{ tab.name }}
            </span>
          </router-link>

          <!-- Action Tab (e.g. More, Scroll) -->
          <button
            v-else
            @click="tab.onClick?.()"
            class="flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition-all duration-150 active:scale-90 min-w-0"
            :class="sheetOpen && tab.name === 'More' ? 'text-[#0C4A6E] font-black' : 'text-slate-600 font-bold hover:text-sky-900'"
          >
            <div 
              class="relative flex items-center justify-center w-10 h-7 rounded-full transition-colors"
              :class="sheetOpen && tab.name === 'More' ? 'bg-sky-100 text-sky-800' : 'text-slate-600'"
            >
              <component :is="tab.icon" class="w-5 h-5 shrink-0" />
            </div>
            <span class="text-[10px] tracking-tight mt-0.5 truncate w-full text-center">
              {{ tab.name }}
            </span>
          </button>

        </template>
      </div>
    </nav>

    <!-- Mobile Action Sheet (Bottom Drawer) -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-full"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-full"
    >
      <div 
        v-if="sheetOpen" 
        class="lg:hidden fixed inset-0 z-50 flex flex-col justify-end"
      >
        <!-- Backdrop -->
        <div 
          class="fixed inset-0 bg-sky-950/40 backdrop-blur-sm transition-opacity"
          @click="closeSheet"
        />

        <!-- Sheet Modal Card -->
        <div class="relative bg-white rounded-t-[2rem] border-t-2 border-[#BAE6FD] shadow-2xl p-5 pb-8 space-y-4 max-h-[85vh] overflow-y-auto z-10">
          
          <!-- Pull Handle Indicator -->
          <div class="w-12 h-1.5 rounded-full bg-slate-300 mx-auto -mt-1 mb-2" />

          <!-- Header & User Card -->
          <div class="flex items-center justify-between pb-3 border-b border-sky-100">
            <div class="flex items-center gap-3 min-w-0">
              <div class="h-11 w-11 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-900 font-black text-base shadow-sm shrink-0">
                {{ username?.charAt(0).toUpperCase() || 'U' }}
              </div>
              <div class="min-w-0">
                <p class="text-sm font-black text-[#0C4A6E] truncate leading-tight">{{ username }}</p>
                <span class="inline-block text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 mt-0.5">
                  {{ portal }} Portal
                </span>
              </div>
            </div>

            <button 
              @click="closeSheet" 
              class="h-9 w-9 rounded-xl bg-sky-50 border border-sky-200 text-slate-700 flex items-center justify-center hover:bg-sky-100 active:scale-95"
              aria-label="Close Menu"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Drawer Navigation Links -->
          <div class="space-y-2 py-1">
            <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Quick Features</p>
            <div 
              v-for="link in drawerLinks" 
              :key="link.name"
              @click="navigateTo(link.path)"
              class="flex items-center justify-between p-3.5 rounded-xl border border-sky-100 bg-sky-50/50 hover:bg-sky-100/70 active:scale-98 cursor-pointer transition-all"
            >
              <div class="flex items-center gap-3 min-w-0">
                <div class="h-9 w-9 rounded-xl bg-white border border-sky-200 text-sky-800 flex items-center justify-center shrink-0 shadow-xs">
                  <component :is="link.icon" class="w-4 h-4 text-sky-800" />
                </div>
                <div class="min-w-0">
                  <p class="text-xs font-black text-slate-900 truncate">{{ link.name }}</p>
                  <p class="text-[10px] font-medium text-slate-600 truncate">{{ link.desc }}</p>
                </div>
              </div>
              <ChevronRight class="w-4 h-4 text-slate-400 shrink-0" />
            </div>
          </div>

          <!-- School Brand Info Banner -->
          <div class="p-3 rounded-xl bg-gradient-to-r from-sky-50 to-amber-50/60 border border-sky-200 text-center">
            <p class="text-[11px] font-black text-[#0C4A6E]">FOLUSHO VICTORY COLLEGE</p>
            <p class="text-[9px] font-bold text-amber-800 uppercase tracking-widest mt-0.5">Excellence • Discipline • Integrity</p>
          </div>

          <!-- Logout Button -->
          <div class="pt-2">
            <button 
              @click="handleLogout"
              class="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-50 hover:bg-red-100 active:bg-red-200 border border-red-200 text-red-700 font-extrabold text-xs uppercase tracking-wider transition-all"
            >
              <LogOut class="w-4 h-4 text-red-700" />
              <span>Sign Out of Portal</span>
            </button>
          </div>

        </div>
      </div>
    </transition>
  </div>
</template>
