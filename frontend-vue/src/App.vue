<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
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
      <span class="floating-math">∫</span>
      <span class="floating-math">∑</span>
      <span class="floating-math">π</span>
      <span class="floating-math">√</span>
      <span class="floating-math">∂</span>
      <span class="floating-math">θ</span>
    </div>

    <div class="relative z-10 min-h-screen text-[#F5F0E8]">
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
  transition: opacity 0.35s ease, transform 0.35s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: #1B2A4A; }
::-webkit-scrollbar-thumb {
  background: rgba(201, 168, 76, 0.2);
  border-radius: 9999px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(201, 168, 76, 0.35);
}
</style>
