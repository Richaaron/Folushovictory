

<script setup lang="ts">
import { useRoute } from 'vue-router'
const route = useRoute()
</script>

<template>
  <div class="app-shell relative">
    <!-- Animated Background Orbs -->
    <div class="neon-bg-orb" style="width: 400px; height: 400px; background: var(--neon-purple); top: -100px; left: -100px;" aria-hidden="true"></div>
    <div class="neon-bg-orb" style="width: 350px; height: 350px; background: var(--neon-blue); top: 20%; right: -80px; animation-delay: -5s;" aria-hidden="true"></div>
    <div class="neon-bg-orb" style="width: 300px; height: 300px; background: var(--neon-cyan); bottom: 10%; left: 10%; animation-delay: -10s;" aria-hidden="true"></div>
    
    <!-- Grid Pattern -->
    <div class="grid-pattern" aria-hidden="true"></div>

    <video
      v-if="route.name !== 'landing'"
      class="background-video"
      autoplay
      muted
      loop
      playsinline
      preload="metadata"
      src="/videos/landing-video.mp4"
    />

    <div class="relative z-10 min-h-screen">
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
  background-image: 
    linear-gradient(135deg, rgba(10, 14, 39, 0.93), rgba(17, 22, 56, 0.95)),
    url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1920&q=80');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
}

.page-enter-active {
  transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1),
              transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-leave-active {
  transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1),
              transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-enter-from {
  opacity: 0;
  transform: translateY(30px) scale(0.96);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-15px) scale(0.96);
}

.background-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.32;
  z-index: 0;
  pointer-events: none;
}

::-webkit-scrollbar { width: 10px; }
::-webkit-scrollbar-track { 
  background: var(--bg-secondary);
}
::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, var(--neon-purple), var(--neon-blue));
  border-radius: 9999px;
  transition: all 0.3s ease;
}
::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, var(--neon-blue), var(--neon-cyan));
  box-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
}
</style>
