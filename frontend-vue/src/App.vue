<script setup lang="ts">
</script>

<template>
  <div class="app-shell min-h-screen text-[#1C1917] relative selection:bg-[#E8A838]/20 selection:text-[#1A4D8F]">
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
  background-color: var(--bg-primary);
  background-image: 
    radial-gradient(circle at 5% 0%, rgba(232, 168, 56, 0.04) 0%, transparent 25%),
    radial-gradient(circle at 95% 15%, rgba(26, 77, 143, 0.05) 0%, transparent 30%),
    radial-gradient(circle at 50% 100%, rgba(45, 106, 79, 0.03) 0%, transparent 35%);
  background-attachment: fixed;
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
