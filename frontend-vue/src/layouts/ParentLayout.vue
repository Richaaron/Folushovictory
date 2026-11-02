<script setup lang="ts">
import Navbar from '../components/common/Navbar.vue'
import MobileBottomNav from '../components/common/MobileBottomNav.vue'
import { LayoutDashboard, Settings } from 'lucide-vue-next'

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, route: '/parent' },
  { name: 'Settings', icon: Settings, route: '/parent/settings' },
]
</script>

<template>
  <div class="min-h-screen flex flex-col bg-transparent text-[#0F172A] antialiased">
    <Navbar portal="Parent" username="Parent Account" :menuItems="menuItems" />
    <main class="flex-grow p-3 sm:p-5 lg:p-6 overflow-x-hidden max-w-7xl mx-auto w-full pb-24 lg:pb-6">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Mobile Native Bottom App Bar -->
    <MobileBottomNav portal="Parent" username="Parent Account" />
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
