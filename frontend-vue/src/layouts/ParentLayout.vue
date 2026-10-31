<script setup lang="ts">
import Navbar from '../components/common/Navbar.vue'
import { LayoutDashboard, Settings } from 'lucide-vue-next'

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, route: '/parent' },
  { name: 'Settings', icon: Settings, route: '/parent/settings' },
]
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#F8FAFC] text-[#1E293B] antialiased">
    <Navbar portal="Parent" username="Parent Account" :menuItems="menuItems" />
    <main class="flex-grow p-3 sm:p-5 lg:p-6 overflow-x-hidden max-w-7xl mx-auto w-full">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
