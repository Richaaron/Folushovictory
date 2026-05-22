<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  // Restore theme from localStorage
  const theme = localStorage.getItem('theme')
  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
})
</script>

<template>
  <div class="app-shell">
    <div class="app-academic-bg" aria-hidden="true">
      <div class="orb orb-purple"></div>
      <div class="orb orb-gold"></div>
      <div class="orb orb-violet"></div>
      <div class="grid-overlay"></div>
      <span class="academic-symbol symbol-sum">∑</span>
      <span class="academic-symbol symbol-pi">π</span>
      <span class="academic-symbol symbol-lambda">λ</span>
      <span class="academic-symbol symbol-root">√</span>
      <span class="sparkle sparkle-one"></span>
      <span class="sparkle sparkle-two"></span>
      <span class="sparkle sparkle-three"></span>
    </div>

    <div class="relative z-10 min-h-screen bg-slate-950 text-slate-100">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>
  </div>
</template>

<style>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Global Scrollbar Styling */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  @apply bg-slate-100 dark:bg-slate-900;
}

::-webkit-scrollbar-thumb {
  @apply bg-slate-300 dark:bg-slate-700 rounded-full hover:bg-royal-purple transition-colors;
}
</style>
