<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ArrowRight, ShieldCheck, Star, Zap, GraduationCap, BookOpen, Trophy, Users } from 'lucide-vue-next'

const router = useRouter()

const navigateToLogin = (portal: string) => {
  router.push({ name: 'login', params: { portal } })
}

const portals = [
  {
    id: 'admin',
    title: 'Admin Portal',
    description: 'Complete institutional control and oversight',
    icon: ShieldCheck,
    gradient: 'from-purple-500 to-pink-500',
    glow: 'shadow-purple-500/50',
    delay: '0s'
  },
  {
    id: 'teacher',
    title: 'Teacher Portal',
    description: 'Manage scores, classes, and student performance',
    icon: BookOpen,
    gradient: 'from-blue-500 to-cyan-500',
    glow: 'shadow-blue-500/50',
    delay: '0.15s'
  },
  {
    id: 'parent',
    title: 'Parent Portal',
    description: 'Track your child\'s academic progress',
    icon: Users,
    gradient: 'from-cyan-500 to-green-500',
    glow: 'shadow-cyan-500/50',
    delay: '0.3s'
  }
]

const features = [
  {
    icon: GraduationCap,
    title: 'Academic Excellence',
    description: 'Comprehensive result management system',
    color: 'purple'
  },
  {
    icon: Trophy,
    title: 'Performance Tracking',
    description: 'Real-time analytics and insights',
    color: 'blue'
  },
  {
    icon: Star,
    title: 'Secure Platform',
    description: 'Enterprise-grade security',
    color: 'cyan'
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Optimized for speed and reliability',
    color: 'pink'
  }
]
</script>

<template>
  <div class="landing-root relative min-h-screen overflow-hidden">
    <!-- ═══════ ANIMATED BACKGROUND ═══════ -->
    <div class="neon-bg-orb" style="width: 500px; height: 500px; background: var(--neon-purple); top: -150px; left: -150px;" aria-hidden="true"></div>
    <div class="neon-bg-orb" style="width: 400px; height: 400px; background: var(--neon-blue); top: 30%; right: -100px; animation-delay: -7s;" aria-hidden="true"></div>
    <div class="neon-bg-orb" style="width: 350px; height: 350px; background: var(--neon-cyan); bottom: 20%; left: 5%; animation-delay: -14s;" aria-hidden="true"></div>
    <div class="neon-bg-orb" style="width: 300px; height: 300px; background: var(--neon-pink); bottom: -100px; right: 20%; animation-delay: -10s;" aria-hidden="true"></div>
    
    <div class="grid-pattern" aria-hidden="true"></div>
    <video
      class="landing-video"
      autoplay
      muted
      loop
      playsinline
      preload="metadata"
      src="/videos/app-video.mp4"
    />

    <!-- ═══════ HEADER WITH LOGO ═══════ -->
    <header class="relative z-20 border-b border-white/5 bg-gradient-to-b from-gray-900/60 to-transparent backdrop-blur-sm">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-2">
        <div class="flex items-center gap-2 sm:gap-3 min-w-0">
          <div class="h-10 w-10 sm:h-14 sm:w-14 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center bg-white/10 backdrop-blur-sm shadow-lg border border-white/20">
            <img src="/logo.png" alt="Folusho Victory Schools" class="h-full w-full object-contain" />
          </div>
          <div class="flex flex-col min-w-0">
            <span class="text-[10px] sm:text-sm font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 truncate">FOLUSHO VICTORY</span>
            <span class="text-[9px] sm:text-xs text-gray-400 truncate">School Management Platform</span>
          </div>
        </div>
        <button 
          @click="navigateToLogin('admin')"
          class="neon-btn text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 flex-shrink-0"
        >
          Admin Access
        </button>
      </div>
    </header>

    <!-- ═══════ FLOATING PARTICLES ═══════ -->
    <div class="particle" style="left: 10%; animation-delay: 0s;" aria-hidden="true"></div>
    <div class="particle" style="left: 25%; animation-delay: -3s; background: var(--neon-blue); box-shadow: 0 0 10px var(--neon-blue);" aria-hidden="true"></div>
    <div class="particle" style="left: 40%; animation-delay: -6s; background: var(--neon-cyan); box-shadow: 0 0 10px var(--neon-cyan);" aria-hidden="true"></div>
    <div class="particle" style="left: 55%; animation-delay: -9s;" aria-hidden="true"></div>
    <div class="particle" style="left: 70%; animation-delay: -12s; background: var(--neon-pink); box-shadow: 0 0 10px var(--neon-pink);" aria-hidden="true"></div>
    <div class="particle" style="left: 85%; animation-delay: -15s; background: var(--neon-blue); box-shadow: 0 0 10px var(--neon-blue);" aria-hidden="true"></div>

    <!-- ═══════ HERO SECTION - FULL WIDTH ═══════ -->
    <section class="hero-section relative">
      <!-- subtle academic watermark image + translucent logo -->
      <div class="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-10">
        <div class="grid gap-8 lg:gap-12 lg:grid-cols-2 lg:items-center">
          
          <!-- LEFT: Hero Content -->
          <div class="space-y-6 sm:space-y-8">
            <div class="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 sm:px-4 py-1.5 sm:py-2 backdrop-blur-sm">
              <Star class="h-3 w-3 sm:h-4 sm:w-4 text-purple-400" />
              <span class="text-xs sm:text-sm font-medium text-purple-300">Next-Gen School Management</span>
            </div>

            <h1 class="neon-heading text-4xl sm:text-5xl lg:text-6xl xl:text-7xl">
              <span class="block text-white">Transform</span>
              <span class="block gradient-text">Academic Excellence</span>
            </h1>

            <p class="neon-body max-w-xl text-base sm:text-lg">
              A powerful, modern platform for managing student results, tracking performance, and empowering educators with real-time insights.
            </p>

            <div class="flex flex-wrap gap-3 sm:gap-4">
              <button 
                @click="navigateToLogin('admin')"
                class="neon-btn group text-sm sm:text-base"
              >
                Get Started
                <ArrowRight class="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
              </button>
              <button class="neon-btn neon-btn-outline text-sm sm:text-base">
                Learn More
              </button>
            </div>

            <!-- Stats -->
            <div class="flex flex-wrap gap-6 sm:gap-8 pt-2 sm:pt-4">
              <div>
                <div class="neon-heading text-2xl sm:text-3xl gradient-text">500+</div>
                <div class="text-xs sm:text-sm text-gray-400">Students</div>
              </div>
              <div>
                <div class="neon-heading text-2xl sm:text-3xl gradient-text">50+</div>
                <div class="text-xs sm:text-sm text-gray-400">Teachers</div>
              </div>
              <div>
                <div class="neon-heading text-2xl sm:text-3xl gradient-text">99.9%</div>
                <div class="text-xs sm:text-sm text-gray-400">Uptime</div>
              </div>
            </div>
          </div>

          <!-- RIGHT: Portal Cards -->
          <div class="space-y-3 sm:space-y-4">
            <div 
              v-for="portal in portals" 
              :key="portal.id"
              @click="navigateToLogin(portal.id)"
              class="glass-card cursor-pointer group"
              :style="{ animationDelay: portal.delay }"
            >
              <div class="flex items-start gap-3 sm:gap-4 p-4 sm:p-6">
                <div 
                  class="flex h-11 w-11 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br shadow-lg transition-transform group-hover:scale-110"
                  :class="[portal.gradient, portal.glow]"
                >
                  <component :is="portal.icon" class="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="neon-heading mb-1 sm:mb-2 text-base sm:text-xl text-white group-hover:text-purple-300 transition-colors">
                    {{ portal.title }}
                  </h3>
                  <p class="neon-body text-xs sm:text-sm">
                    {{ portal.description }}
                  </p>
                </div>
                <ArrowRight class="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 transition-all group-hover:translate-x-2 group-hover:text-purple-400 flex-shrink-0" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════ DIVIDER ═══════ -->
    <div class="section-divider"></div>

    <!-- ═══════ FEATURES SECTION - FULL WIDTH ═══════ -->
    <section class="hero-section py-12 sm:py-20">
      <div class="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mb-10 sm:mb-16 text-center">
          <h2 class="neon-heading mb-3 sm:mb-4 text-3xl sm:text-4xl lg:text-5xl text-white">
            Why Choose <span class="gradient-text">Our Platform</span>
          </h2>
          <p class="neon-body mx-auto max-w-2xl text-base sm:text-lg">
            Built with modern technology for reliability, speed, and an exceptional user experience
          </p>
        </div>

        <div class="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
          <div 
            v-for="(feature, index) in features" 
            :key="index"
            class="glass-card group"
            :style="{ animationDelay: `${index * 0.1}s` }"
          >
            <div class="p-4 sm:p-6 text-center">
              <div 
                class="mx-auto mb-3 sm:mb-4 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-3"
                :class="[
                  feature.color === 'purple' ? 'from-purple-500 to-pink-500 shadow-purple-500/50' : '',
                  feature.color === 'blue' ? 'from-blue-500 to-cyan-500 shadow-blue-500/50' : '',
                  feature.color === 'cyan' ? 'from-cyan-500 to-green-500 shadow-cyan-500/50' : '',
                  feature.color === 'pink' ? 'from-pink-500 to-purple-500 shadow-pink-500/50' : ''
                ]"
              >
                <component :is="feature.icon" class="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 class="neon-heading mb-1 sm:mb-2 text-sm sm:text-lg text-white">
                {{ feature.title }}
              </h3>
              <p class="neon-body text-xs sm:text-sm">
                {{ feature.description }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════ CTA SECTION ═══════ -->
    <section class="hero-section py-12 sm:py-20">
      <div class="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div class="glass-card glass-card-purple p-6 sm:p-12 text-center">
          <h2 class="neon-heading mb-3 sm:mb-4 text-2xl sm:text-3xl lg:text-4xl text-white">
            Ready to <span class="gradient-text">Get Started</span>?
          </h2>
          <p class="neon-body mx-auto mb-6 sm:mb-8 max-w-xl text-base sm:text-lg">
            Join hundreds of educators and students already using our platform
          </p>
          <button 
            @click="navigateToLogin('admin')"
            class="neon-btn neon-btn-purple text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4"
          >
            Access Your Portal
            <ArrowRight class="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
      </div>
    </section>

    <!-- ═══════ BOTTOM NEON LINE ═══════ -->
    <div class="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 opacity-80" aria-hidden="true"></div>
  </div>
</template>

<style scoped>
.landing-root {
  background: var(--bg-primary);
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  overflow: hidden;
}

.landing-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.24;
  z-index: 0;
  pointer-events: none;
}
</style>
