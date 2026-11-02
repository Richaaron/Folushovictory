<script setup lang="ts">
import Navbar from '../components/common/Navbar.vue'
import MobileBottomNav from '../components/common/MobileBottomNav.vue'
import { ClipboardList, LayoutDashboard, Settings } from 'lucide-vue-next'

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, route: '/teacher' },
  { name: 'Activities', icon: ClipboardList, route: '/teacher/activities' },
  { name: 'Settings', icon: Settings, route: '/teacher/settings' },
]
</script>

<template>
  <div class="min-h-screen flex flex-col bg-transparent text-[#0F172A] antialiased">
    <Navbar portal="Teacher" username="Faculty Staff" :menuItems="menuItems" />
    <main class="flex-grow p-3 sm:p-5 lg:p-6 overflow-x-hidden max-w-7xl mx-auto w-full pb-24 lg:pb-6">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Mobile Native Bottom App Bar -->
    <MobileBottomNav portal="Teacher" username="Faculty Staff" />
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
