<script setup lang="ts">
import Navbar from '../components/common/Navbar.vue'
import { LayoutDashboard, Settings } from 'lucide-vue-next'

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, route: '/parent' },
  { name: 'Settings', icon: Settings, route: '/parent/settings' },
]
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#F7F4EE] text-[#1C1917] relative">
    <Navbar portal="Parent" username="Parent Account" :menuItems="menuItems" />
    <main class="flex-grow p-4 sm:p-6 lg:p-8 overflow-x-hidden">
      <div class="mx-auto max-w-7xl">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
