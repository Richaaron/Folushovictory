<script setup lang="ts">
import Navbar from '../components/common/Navbar.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
    <Navbar portal="Parent" username="Parent User" />
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
