<script setup lang="ts">
import Navbar from '../components/common/Navbar.vue'
import { LayoutDashboard } from 'lucide-vue-next'
import { useAuthStore } from '../stores/authStore'

const authStore = useAuthStore()
const menuItems = [
  { name: 'My Results & Subjects', icon: LayoutDashboard, route: '/student' }
]
</script>

<template>
  <div class="min-h-screen flex flex-col bg-transparent text-[#0F172A] antialiased">
    <Navbar portal="Student" :username="authStore.user?.displayName || authStore.user?.username || 'Student'" :menuItems="menuItems" />
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
