<script setup lang="ts">
</script>

<template>
  <div class="app-shell min-h-screen text-slate-900 relative selection:bg-amber-300 selection:text-sky-950">
    <div class="relative z-10 min-h-screen flex flex-col">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>
  </div>
</template>

<style>
.app-shell {
  background: transparent;
  min-height: 100vh;
  overflow-x: clip;
}

.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
