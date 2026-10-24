<script setup lang="ts">
import Navbar from '../components/common/Navbar.vue'
import { LayoutDashboard } from 'lucide-vue-next'
import { useAuthStore } from '../stores/authStore'

const authStore = useAuthStore()
const menuItems = [
  { name: 'My Learning', icon: LayoutDashboard, route: '/student' }
]
</script>

<template>
  <div class="min-h-screen flex flex-col text-[#F5F0E8] relative overflow-hidden bg-slate-950">
    <Navbar portal="Student" :username="authStore.user?.displayName || authStore.user?.username" :menuItems="menuItems" />
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
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
